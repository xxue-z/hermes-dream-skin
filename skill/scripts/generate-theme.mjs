#!/usr/bin/env node
/**
 * Hermes Dream Skin — 主题生成器 (generate-theme.mjs)
 *
 * 读取一份「主题规格(spec)」JSON，自动派生完整 --ds-* 调色板，
 * 生成符合插件规则的 themes/<id>/theme.json，并可选复制背景图。
 *
 * 用法：
 *   node generate-theme.mjs --spec spec.json
 *   cat spec.json | node generate-theme.mjs
 *   node generate-theme.mjs --spec spec.json --themes-dir ../themes
 *   node generate-theme.mjs --palette tech-deep-blue --spec spec.json   # 用预设色卡
 *   node generate-theme.mjs --palette                                    # 用默认色卡
 *
 * spec 字段说明见 skill/references/theme-format.md。
 *
 * ⚠️ 调色板结构严格对齐 src/style-config.js 的 DEFAULT_PALETTE_CSS，
 *    仅把 bg / accent / text 等少量输入映射为 --ds-* 变量，
 *    渐变遮罩(--ds-hero-scrim 等) 一律引用 --ds-*-rgb 派生变量，确保渲染正确。
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ---------------------------------------------------------------------------
// 颜色工具
// ---------------------------------------------------------------------------
function parseHex(hex) {
  let h = String(hex).trim().replace(/^#/, '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  if (h.length === 6) h += 'ff'
  if (h.length !== 8) throw new Error(`非法 hex 颜色: "${hex}"`)
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
    a: parseInt(h.slice(6, 8), 16) / 255,
  }
}
function toHex({ r, g, b }) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return '#' + c(r) + c(g) + c(b)
}
function toHex8({ r, g, b }, alpha = 1) {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0')
  return toHex({ r, g, b }) + a
}
function mix(c1, c2, t) {
  const a = parseHex(c1)
  const b = parseHex(c2)
  return { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t }
}
const mixHex = (c1, c2, t) => toHex(mix(c1, c2, t))
const lighten = (hex, t) => mixHex(hex, '#ffffff', t)
const darken = (hex, t) => mixHex(hex, '#000000', t)
function luminance({ r, g, b }) {
  const f = (c) => {
    c /= 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
function rgba(hex, alpha) {
  const { r, g, b } = parseHex(hex)
  return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${alpha})`
}
const spaceRgb = (hex) => {
  const { r, g, b } = parseHex(hex)
  return `${Math.round(r)} ${Math.round(g)} ${Math.round(b)}`
}

// ---------------------------------------------------------------------------
// 调色板派生（对齐 DEFAULT_PALETTE_CSS 的结构）
// ---------------------------------------------------------------------------
function derivePalette(p) {
  const bg = p.bg || '#111318'
  const accent = p.accent || '#8298a3'
  const text = p.text || '#edf0f1'

  const panel = p.panel || lighten(bg, 0.08)
  const panel2 = p.panel2 || lighten(bg, 0.16)
  const accentAlt = p.accentAlt || lighten(accent, 0.12)
  const secondary = p.secondary || mixHex(accent, text, 0.4)
  const highlight = p.highlight || darken(accent, 0.2)
  const muted = p.muted || mixHex(text, bg, 0.5)
  const line = p.line || rgba(accent, 0.24)

  const onAccent = luminance(parseHex(accent)) > 0.5 ? '#0e1116' : '#ffffff'

  return {
    bg,
    panel,
    panel2,
    accent,
    accentAlt,
    secondary,
    highlight,
    text,
    muted,
    line,
    onAccent,
  }
}

function buildPaletteCSS(pal) {
  const { bg, panel, panel2, accent, accentAlt, secondary, highlight, text, muted, line, onAccent } = pal
  return `:root{
  color-scheme:dark;
  --ds-bg:${bg}; --ds-panel:${panel}; --ds-panel-2:${panel2};
  --ds-green:${accent}; --ds-lime:${accentAlt}; --ds-cyan:${secondary}; --ds-purple:${highlight};
  --ds-text:${text}; --ds-muted:${muted}; --ds-line:${line};
  --ds-bg-rgb:${spaceRgb(bg)}; --ds-panel-rgb:${spaceRgb(panel)}; --ds-panel-2-rgb:${spaceRgb(panel2)};
  --ds-text-rgb:${spaceRgb(text)}; --ds-muted-rgb:${spaceRgb(muted)};
  --ds-accent-rgb:${spaceRgb(accent)}; --ds-secondary-rgb:${spaceRgb(secondary)}; --ds-highlight-rgb:${spaceRgb(highlight)};
  --ds-accent:var(--ds-green); --ds-accent-soft:var(--ds-lime);
  --ds-secondary:var(--ds-cyan); --ds-highlight:var(--ds-purple);
  --ds-on-accent:${onAccent};
  --ds-hero-scrim:linear-gradient(90deg,rgb(var(--ds-bg-rgb)/.90) 0%,rgb(var(--ds-bg-rgb)/.76) 50%,rgb(var(--ds-bg-rgb)/.18) 84%,transparent 100%);
  --ds-task-shade:linear-gradient(90deg,rgb(var(--ds-bg-rgb)/.56) 0%,rgb(var(--ds-bg-rgb)/.36) 48%,rgb(var(--ds-bg-rgb)/.12) 100%);
  --ds-task-fade:linear-gradient(180deg,rgb(var(--ds-bg-rgb)/.10) 0%,rgb(var(--ds-bg-rgb)/.18) 32%,rgb(var(--ds-bg-rgb)/.76) 68%,rgb(var(--ds-bg-rgb)/1) 100%);
  --ds-immersive-edge:rgb(var(--ds-bg-rgb)/.40); --ds-immersive-mid:rgb(var(--ds-bg-rgb)/.26); --ds-immersive-far:rgb(var(--ds-bg-rgb)/.16);
  --ds-immersive-sidebar:rgb(var(--ds-panel-rgb)/.46); --ds-task-immersive-sidebar:rgb(var(--ds-panel-rgb)/.70);
  --ds-immersive-chrome:rgb(var(--ds-panel-rgb)/.28); --ds-immersive-composer:rgb(var(--ds-panel-rgb)/.44);
  --ds-immersive-composer-solid:color-mix(in srgb,rgb(var(--ds-panel-2-rgb)) 88%,rgb(var(--ds-muted-rgb)) 12%);
  --ds-immersive-line:rgb(var(--ds-muted-rgb)/.42);
  --ds-task-immersive-edge:rgb(var(--ds-bg-rgb)/.82); --ds-task-immersive-mid:rgb(var(--ds-bg-rgb)/.74); --ds-task-immersive-far:rgb(var(--ds-bg-rgb)/.60);
}`
}

// ---------------------------------------------------------------------------
// 读取 spec
// ---------------------------------------------------------------------------
function loadSpec(argv) {
  const specIdx = argv.indexOf('--spec')
  if (specIdx !== -1 && argv[specIdx + 1]) {
    return JSON.parse(fs.readFileSync(argv[specIdx + 1], 'utf8'))
  }
  // stdin
  if (!process.stdin.isTTY) {
    let raw = ''
    process.stdin.setEncoding('utf8')
    return new Promise((resolve) => {
      process.stdin.on('data', (d) => (raw += d))
      process.stdin.on('end', () => resolve(raw.trim() ? JSON.parse(raw) : null))
    })
  }
  return null
}

// 解析 --palette <id>：从 references/palettes.json 读取预设色卡。
// 返回 { id, name, mood, colors } 或 null；缺 id 时用文件里的 default。
function resolvePaletteArg(argv) {
  const idx = argv.indexOf('--palette')
  if (idx === -1) return null
  let id = argv[idx + 1]
  if (!id || id.startsWith('--')) id = null
  const file = path.join(__dirname, '..', 'references', 'palettes.json')
  if (!fs.existsSync(file)) {
    console.error('✗ 找不到 references/palettes.json（请确认 skill 目录完整）')
    process.exit(1)
  }
  const doc = JSON.parse(fs.readFileSync(file, 'utf8'))
  const target = id || doc.default
  const entry = doc.palettes.find((p) => p.id === target)
  if (!entry) {
    console.error(
      `✗ palettes.json 中无此 id: "${target}"\n   可选: ${doc.palettes.map((p) => p.id).join(', ')}`
    )
    process.exit(1)
  }
  return entry
}

function slugify(name) {
  return (
    String(name)
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'theme'
  )
}

// ---------------------------------------------------------------------------
// 主流程
// ---------------------------------------------------------------------------
async function main() {
  const argv = process.argv.slice(2)
  const spec = await loadSpec(argv)
  if (!spec) {
    console.error('✗ 未提供有效 spec。用法:')
    console.error('    node generate-theme.mjs --spec spec.json')
    console.error('    cat spec.json | node generate-theme.mjs')
    console.error('    node generate-theme.mjs --palette <id> --spec spec.json')
    process.exit(1)
  }

  // 预设色卡（--palette）作为基础调色板；spec.palette 中的字段可逐项覆盖。
  const paletteArg = resolvePaletteArg(argv)
  if (paletteArg) {
    if (!spec.name) spec.name = paletteArg.name
    if (!spec.description) spec.description = paletteArg.mood || ''
    if (!spec.palette) spec.palette = {}
    spec.palette = Object.assign({}, paletteArg.colors, spec.palette)
    console.log(`🎨 使用预设色卡: ${paletteArg.id}（${paletteArg.name}）`)
  }

  if (!spec.name) {
    console.error('✗ spec 缺少 name（或先用 --palette 提供默认名）。')
    process.exit(1)
  }

  const pal = derivePalette(spec.palette || {})

  const id = spec.id || `theme-${Date.now()}`
  const name = spec.name
  const description = spec.description || ''
  const appearance = spec.appearance || 'auto'

  const art = Object.assign(
    { focusX: 0.5, focusY: 0.35, safeArea: 'center', taskMode: 'ambient' },
    spec.art || {}
  )

  const fontFamily =
    (spec.font && spec.font.family) ||
    '"Segoe UI Variable Text", "Segoe UI", "Microsoft YaHei UI", system-ui, sans-serif'
  const fontSize = (spec.font && spec.font.size) || 14
  const fontColor = (spec.font && spec.font.color) || pal.text

  const bgColor8 = toHex8(parseHex(pal.bg), 0.86)
  const background = Object.assign(
    {
      gradient: false,
      glass: true,
      colors: [bgColor8],
      gradientOpacity: 100,
      layerOpacity: 100,
      frost: 14,
    },
    spec.background || {}
  )
  if (!background.colors || !background.colors.length) background.colors = [bgColor8]

  const border = Object.assign(
    { color: pal.accent, width: 0, radius: 0 },
    spec.border || {}
  )

  const emptyArea = () => ({ enabled: false, font: {}, background: {}, border: {} })
  const areas = Object.assign(
    { topBar: emptyArea(), leftSidebar: emptyArea(), chatArea: emptyArea(), bottomBar: emptyArea() },
    spec.areas || {}
  )

  // 背景图处理
  let image = spec.image || null
  let bgSrc = spec.backgroundImage || null
  const themesDirArg = (() => {
    const i = argv.indexOf('--themes-dir')
    return i !== -1 ? argv[i + 1] : null
  })()
  const themesDir = path.resolve(themesDirArg || path.join(process.cwd(), 'themes'))
  const themeDir = path.join(themesDir, id)

  if (bgSrc) {
    if (!fs.existsSync(bgSrc)) {
      console.error(`✗ 背景图不存在: ${bgSrc}`)
      process.exit(1)
    }
    fs.mkdirSync(themeDir, { recursive: true })
    const base = path.basename(bgSrc)
    fs.copyFileSync(bgSrc, path.join(themeDir, base))
    image = base
    console.log(`📷 已复制背景图 → ${path.join(themeDir, base)}`)
  }

  const theme = {
    schemaVersion: 1,
    id,
    name,
    description,
    appearance,
    art,
    image,
    styles: {
      global: {
        font: { family: fontFamily, size: fontSize, color: fontColor },
        background,
        border,
      },
      areas,
      customCSS: buildPaletteCSS(pal),
    },
  }

  fs.mkdirSync(themeDir, { recursive: true })
  const outFile = path.join(themeDir, 'theme.json')
  fs.writeFileSync(outFile, JSON.stringify(theme, null, 2), 'utf8')

  console.log('\n✅ 主题已生成:')
  console.log(`   路径: ${outFile}`)
  console.log(`   id:   ${id}`)
  console.log(`   背景: ${image ? image : '(无背景图 → 使用 ' + (background.gradient ? '渐变' : '纯色') + ' 背景)'}`)
  console.log(`   强调色: ${pal.accent}   文字: ${fontColor}   字号: ${fontSize}px`)
  console.log('\n下一步: 在 Hermes Desktop 的 Dream Skin 面板点「重新扫描(Rescan)」即可看到并应用该主题。')
}

main().catch((e) => {
  console.error('✗ 生成失败:', e.message)
  process.exit(1)
})
