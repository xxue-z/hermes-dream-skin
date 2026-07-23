// 将默认主题（DEFAULT_STYLES.customCSS）同步进三套预设的模块化 styles 字段，
// 并为每套预设写入「完整调色板」（取自 Codex-Dream-Skin 对应主题的 colors）。
//
// Codex 侧事实（已核实）：
//  - 仅 Gothic 在 theme.json 里有显式 colors（金/米色）。
//  - Ultraman 在 Codex 即「默认主题」，使用 dream-skin.css 的 :root 默认调色板（青/绿）。
//  - Arina 在 Codex 无 colors（随背景图自适应）；此处取 Codex 默认主题的同款玫瑰红
//    #E25563 作为签名色，做成暗色玫瑰主题，贴合其「柔光与玫瑰」设定。
//  - 选择器与本侧（Hermes）宿主 DOM 一致，沿用 DEFAULT_STYLES 已重写好的元素规则。
//
// 每套预设的 customCSS = 默认 customCSS（含 scrim/渐变等派生变量） + 一套完整 :root
// 调色板覆盖。覆盖块放在后面，确保优先级更高；派生变量用 var(--ds-*-rgb) 引用基础变量，
// 因此会随覆盖自动重算。
//
// ⚠️ 关键：除 themes/<id>/theme.json（参考/可被宿主扫描）外，本脚本**额外写出
// src/presets.js（AUTO-GENERATED）**——把三套细化配色作为「打包种子」编入 plugin.js。
// 原因：插件运行时只从 PluginStorage 取主题，全仓库 src/ 没有任何读取 themes/*.json 的逻辑，
// 因此直接改 themes/*.json 对运行中的插件无效。把种子打进 bundle 可保证细化后的配色
// 在运行时必定生效，且不依赖宿主文件系统。
//
// ⚠️ 主题文件仅携带「调色板」（per-theme 颜色）：customCSS = 默认调色板 + 本套 :root 覆盖块。
//    元素级覆盖（侧栏/聊天区/输入框…）已抽出到 DEFAULT_GLOBAL_CSS（全局规则），
//    随插件启动注入、在 src/theme-manager.js 与 css-injector.js 中处理，不再进主题文件。
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEFAULT_PALETTE_CSS } from './src/style-config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname)

// 1) 默认主题调色板（per-theme 颜色的单一可信源，来自 style-config.js 导出）
const baseCSS = DEFAULT_PALETTE_CSS

// 2) 结构与 DEFAULT_STYLES 一致的 global / areas（调色板无关，保持默认）
//    注意：background 带 gradient:false / glass:true —— 玻璃蒙板是「主题背景设置」
//    的一部分（由 css-injector.generateStructuredCSS 生成），全局规则不再做装饰性处理。
const global = {
  font: { family: '"Segoe UI Variable Text", "Segoe UI", "Microsoft YaHei UI", system-ui, sans-serif', size: 14, color: '#edf0f1' },
  background: { color: '#191c22', opacity: 86, gradient: false, glass: true },
  border: { color: '#8298a3', width: 0, radius: 0 }
}
const areas = {
  topBar: { enabled: false, font: {}, background: {}, border: {} },
  leftSidebar: { enabled: false, font: {}, background: {}, border: {} },
  chatArea: { enabled: false, font: {}, background: {}, border: {} },
  bottomBar: { enabled: false, font: {}, background: {}, border: {} }
}

// 3) hex(#RRGGBB) -> "r g b"
const hexToRgbStr = (hex) => {
  const h = hex.replace('#', '')
  const n = parseInt(h, 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}

// 4) 由调色板生成完整 :root 覆盖块（与 DEFAULT_STYLES 的 :root 结构一致）
//    keys: bg, panel, panel2, accent, accentAlt, secondary, highlight, text, muted, line
const buildRoot = (p) => `:root{
  color-scheme:dark;
  --ds-bg:${p.bg}; --ds-panel:${p.panel}; --ds-panel-2:${p.panel2};
  --ds-green:${p.accent}; --ds-lime:${p.accentAlt}; --ds-cyan:${p.secondary}; --ds-purple:${p.highlight};
  --ds-text:${p.text}; --ds-muted:${p.muted}; --ds-line:${p.line};
  --ds-bg-rgb:${hexToRgbStr(p.bg)}; --ds-panel-rgb:${hexToRgbStr(p.panel)}; --ds-panel-2-rgb:${hexToRgbStr(p.panel2)};
  --ds-text-rgb:${hexToRgbStr(p.text)}; --ds-muted-rgb:${hexToRgbStr(p.muted)};
  --ds-accent-rgb:${hexToRgbStr(p.accent)}; --ds-secondary-rgb:${hexToRgbStr(p.secondary)}; --ds-highlight-rgb:${hexToRgbStr(p.highlight)};
  --ds-accent:var(--ds-green); --ds-accent-soft:var(--ds-lime);
  --ds-secondary:var(--ds-cyan); --ds-highlight:var(--ds-purple);
  --ds-on-accent:rgb(var(--ds-bg-rgb)/1);
}`

// 5) 三套预设各自的完整调色板（取自 Codex 对应主题）
const presets = [
  {
    id: 'preset-ultraman',
    source: 'Codex :root.codex-dream-skin 默认调色板（青/绿）',
    // Codex 默认 = teal/green，与 DEFAULT_STYLES 同值，ultraman 即 Codex 默认主题
    palette: {
      bg: '#111318', panel: '#191c22', panel2: '#20242b',
      accent: '#8298a3', accentAlt: '#a0adb3', secondary: '#8da397', highlight: '#9d94a3',
      text: '#edf0f1', muted: '#a3aaae', line: 'rgba(130,152,163,.24)'
    }
  },
  {
    id: 'preset-arina-hashimoto',
    source: 'Codex 默认主题签名色 #E25563，改为暗色玫瑰主题',
    palette: {
      bg: '#1a1416', panel: '#241b1e', panel2: '#2e2226',
      accent: '#E25563', accentAlt: '#F07A86', secondary: '#F3A8AF', highlight: '#C93D4C',
      text: '#f6eef0', muted: '#b59aa0', line: 'rgba(226,85,99,.24)'
    }
  },
  {
    id: 'preset-gothic-void-crusade',
    source: 'Codex preset-gothic-void-crusade colors（金/米色）',
    palette: {
      bg: '#0d0d0e', panel: '#171513', panel2: '#211d18',
      accent: '#c8a55a', accentAlt: '#e3c27a', secondary: '#74352e', highlight: '#8a2f27',
      text: '#f3ead7', muted: '#b5a386', line: 'rgba(200,165,90,.28)'
    }
  }
]

const DEFAULT_ART = { focusX: 0.5, focusY: 0.35, safeArea: 'center', taskMode: 'ambient' }
const NAMES = {
  'preset-ultraman': 'Ultraman',
  'preset-arina-hashimoto': 'Arina Hashimoto',
  'preset-gothic-void-crusade': 'Gothic Void Crusade'
}

const seedOut = []

for (const p of presets) {
  const file = path.join(root, 'themes', p.id, 'theme.json')
  if (!fs.existsSync(file)) { console.warn('跳过（无文件）：', file); continue }
  const theme = JSON.parse(fs.readFileSync(file, 'utf8'))

  const override = `/* ${p.source} */\n` + buildRoot(p.palette)
  // 每套预设的玻璃蒙板使用各自调色板的 panel 色（风格统一），而非统一的默认色
  const globalForPreset = {
    ...JSON.parse(JSON.stringify(global)),
    background: { color: p.palette.panel, opacity: 86, gradient: false, glass: true }
  }
  theme.styles = {
    global: globalForPreset,
    areas: JSON.parse(JSON.stringify(areas)),
    customCSS: baseCSS + '\n' + override
  }
  // 同步元数据 palette（host 预览用，非 CSS 注入路径）
  theme.palette = {
    accent: p.palette.accent,
    accentInk: p.palette.bg
  }

  fs.writeFileSync(file, JSON.stringify(theme, null, 2) + '\n', 'utf8')
  console.log(`✓ 已同步预设：${p.id}  ←  ${p.source}`)

  // 收集到打包种子（供 plugin.js 运行时使用，无需宿主读文件）
  seedOut.push({
    id: p.id,
    name: NAMES[p.id] || p.id,
    appearance: 'auto',
    art: { ...DEFAULT_ART },
    image: null,
    styles: theme.styles
  })
}

// 写出 src/presets.js（AUTO-GENERATED）：把细化后的预设配色打进 bundle，
// 解决「插件运行时只从 PluginStorage 读取、不读 themes/*.json」导致修改不生效的问题。
const seedJs = `// AUTO-GENERATED by sync-presets.mjs — 请勿手改。\n` +
  `// 三套预设的「打包种子」：保证细化后的配色进入 plugin.js 运行时，\n` +
  `// 不依赖宿主文件系统读取 themes/*.json（插件运行时只从 PluginStorage 取主题）。\n` +
  `export const PRESET_THEMES = ${JSON.stringify(seedOut, null, 2)}\n`
fs.writeFileSync(path.join(root, 'src', 'presets.js'), seedJs, 'utf8')
console.log(`✓ 已写出 src/presets.js（打包种子，共 ${seedOut.length} 套）`)

console.log('完成。三套预设现已各自携带完整调色板（基础变量 + 派生 -rgb + 别名），继承默认主题的元素规则。')
