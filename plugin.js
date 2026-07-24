/**
 * Hermes Dream Skin Plugin
 * Generated at: 2026-07-24T06:11:32.490Z
 */

import React from 'react'

// --- style-config.js ---
/**
 * 样式配置模块
 *
 * 定义区域选择器映射、默认样式结构和 UI 元数据
 */

/** 区域到 DOM 选择器的映射（选择器均来自 docs/hermes-desktop-plugin-dev 的已验证清单） */
const AREA_SELECTORS = {
  topBar: 'div[class*="h-[34px]"]',
  leftSidebar: '[data-tree-group="grp-sessions"]',
  chatArea: '[data-tree-group="grp-main"]',
  bottomBar: '[data-slot="statusbar"]'
}

/**
 * 默认样式结构
 *
 * 移植自 Codex-Dream-Skin 的「默认主题」（macos/assets/dream-skin.css 的
 * --ds-* 调色板 + ultraman-theme/dream-skin.css 的元素规则）。
 *
 * ⚠️ 选择器均按本侧（Hermes）宿主 DOM 重写，并对照
 *    docs/hermes-desktop-plugin-dev（hermes-dom-selectors.md / SKILL.md）的「已验证」清单核对：
 *   - 根标记：   html.dream-skin-active
 *   - 侧栏：     [data-tree-group="grp-sessions"]
 *   - 主内容区： [data-tree-group="grp-main"]
 *   - 消息视口： [data-slot="aui_thread-viewport"]
 *   - 用户消息： [data-role="user"]          助手消息： [data-slot="aui_assistant-message-root"]
 *   - 输入框：   [data-slot="composer-surface"]   （外层 [data-slot="composer-bounds"]）
 *   - 顶栏：     div[class*="h-[34px]"]         底栏： [data-slot="statusbar"]
 *   - 变量：     --ds-* / --dream-skin-*
 *   背景图不靠把 background-image 写到主区（会被覆盖），而由 css-injector.injectChrome()
 *   以「固定背景层」（body.firstChild，无 z-index / 无 opacity:0）注入；主区保持透明露出背景层。
 */
/**
 * 主题「调色板」（per-theme，放入主题文件 styles.customCSS）
 *
 * 仅包含 :root 变量定义——颜色 / 字体随主题变化的部分。
 * 元素级覆盖（侧栏、聊天区、输入框…）统一抽到 DEFAULT_GLOBAL_CSS（全局规则），
 * 它们引用 --ds-* 变量，由当前激活主题的这份调色板供给颜色。
 */
const DEFAULT_PALETTE_CSS = `:root{
  color-scheme:dark;
  --ds-bg:#111318; --ds-panel:#191c22; --ds-panel-2:#20242b;
  --ds-green:#8298a3; --ds-lime:#a0adb3; --ds-cyan:#8da397; --ds-purple:#9d94a3;
  --ds-text:#edf0f1; --ds-muted:#a3aaae; --ds-line:rgba(130,152,163,.24);
  --ds-bg-rgb:17 19 24; --ds-panel-rgb:25 28 34; --ds-panel-2-rgb:32 36 43;
  --ds-text-rgb:237 240 241; --ds-muted-rgb:163 170 174;
  --ds-accent-rgb:130 152 163; --ds-secondary-rgb:141 163 151; --ds-highlight-rgb:141 163 151;
  --ds-accent:var(--ds-green); --ds-accent-soft:var(--ds-lime);
  --ds-secondary:var(--ds-cyan); --ds-highlight:var(--ds-purple);
  --ds-on-accent:rgb(var(--ds-bg-rgb)/1);
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

/**
 * 全局规则（与主题解耦，不放入主题文件）
 *
 * ⚠️ 职责定位：GLOBAL RULES 只做「中性化」——移除 Hermes Desktop 默认的
 *    不透明背景 / 默认模糊 / 默认边框等，让主题的样式（在全局规则之后注入）能
 *    正常接管。它**不做任何装饰性处理**（例如把官方白色背景改成玻璃蒙板）。
 *
 * 装饰性效果（玻璃蒙板、渐变、面板配色等）一律由「主题背景设置」提供，
 * 见 src/style-config.js 的 DEFAULT_STYLES.global.background（color / opacity /
 * gradient / glass），由 css-injector.generateStructuredCSS 生成、随主题注入。
 *
 * 注入时机：插件启动时即写入独立的 <style id="hermes-dream-skin-global">，
 * 对应用户界面立即生效；面板「Global Rules」弹框可查看 / 修改并即时重注入。
 *
 * ⚠️ 聊天区白底根因：宿主 Tailwind 工具类 bg-(--ui-chat-surface-background) 编译为
 *    .bg-\(--ui-chat-surface-background\){background-color:var(--ui-chat-surface-background)}。
 *    此处把该变量在 dream-skin-active 作用域内重定义为 **transparent**，
 *    让工具类自身解析成透明，彻底消除白底。
 */
const DEFAULT_GLOBAL_CSS = `html.dream-skin-active{color:var(--ds-text)!important;}
html.dream-skin-active [data-tree-group="grp-sessions"]{background:transparent!important;backdrop-filter:none!important;border-color:transparent!important;}
html.dream-skin-active [data-tree-group="grp-main"]{background:transparent!important;border-color:transparent!important;}
html.dream-skin-active [data-composer-target="main"][data-session-anchor="workspace"]{background-color:transparent!important;}
html.dream-skin-active [data-slot="aui_thread-viewport"]{background:transparent!important;}
html.dream-skin-active [data-role="user"],html.dream-skin-active [data-slot="aui_assistant-message-root"]{background:transparent!important;backdrop-filter:none!important;}
html.dream-skin-active [data-slot="composer-surface"]{background:transparent!important;backdrop-filter:none!important;}
html.dream-skin-active{--ui-chat-surface-background:transparent;--ui-sidebar-surface-background:transparent;}
@media (prefers-reduced-motion: reduce){
  html.dream-skin-active *{transition-duration:.01ms!important;scroll-behavior:auto!important;}
}`

const DEFAULT_STYLES = {
  global: {
    font: {
      family: '"Segoe UI Variable Text", "Segoe UI", "Microsoft YaHei UI", system-ui, sans-serif',
      size: 14,
      color: '#edf0f1'
    },
    background: { gradient: false, glass: true, colors: ['#191c22db'], gradientOpacity: 100, layerOpacity: 100 },
    border: { color: '#8298a3', width: 0, radius: 0 }
  },
  areas: {
    topBar: { enabled: false, font: {}, background: {}, border: {} },
    leftSidebar: { enabled: false, font: {}, background: {}, border: {} },
    chatArea: { enabled: false, font: {}, background: {}, border: {} },
    bottomBar: { enabled: false, font: {}, background: {}, border: {} }
  },
  // 主题文件（per-theme）仅携带调色板；元素级覆盖见下方 globalCSS（全局规则）
  customCSS: DEFAULT_PALETTE_CSS,
  globalCSS: DEFAULT_GLOBAL_CSS
}

/** 样式属性的 UI 元数据 */
const STYLE_METADATA = {
  font: {
    family: { label: 'Font Family', type: 'text', default: 'system-ui' },
    size: { label: 'Font Size', type: 'range', min: 10, max: 24, unit: 'px', default: 14 },
    color: { label: 'Font Color', type: 'color', default: '#ffffff', hasOpacity: true }
  },
  background: {
    color: { label: 'Background Color', type: 'color', default: '#191c22db', hasOpacity: true },
    gradient: { label: 'Enable Gradient', type: 'checkbox', default: false },
    glass: { label: 'Glass Mask', type: 'checkbox', default: true }
  },
  border: {
    color: { label: 'Border Color', type: 'color', default: '#333333', hasOpacity: true },
    width: { label: 'Border Width', type: 'range', min: 0, max: 10, unit: 'px', default: 1 },
    radius: { label: 'Border Radius', type: 'range', min: 0, max: 24, unit: 'px', default: 8 }
  }
}

// --- style-editor.js ---
/**
 * 样式编辑器组件
 *
 * 提供可视化样式编辑界面：
 * - 标签切换（全局/顶部栏/左侧栏/聊天区/底部栏）
 * - 属性控制面板（颜色、范围滑块、文本输入）
 * - CSS 预览面板
 */


const TABS = [
  { id: 'global', label: 'Global' },
  { id: 'topBar', label: 'Top Bar' },
  { id: 'leftSidebar', label: 'Left Sidebar' },
  { id: 'chatArea', label: 'Chat Area' },
  { id: 'bottomBar', label: 'Bottom Bar' }
]

/**
 * 生成 CSS 预览字符串（简化版）
 */
function generatePreviewCSS(draftStyles) {
  if (!draftStyles) return ''

  const lines = []
  const { global, areas, customCSS } = draftStyles

  lines.push('html.dream-skin-active {')
  if (global?.font?.family) lines.push(`  font-family: '${global.font.family}';`)
  if (global?.font?.size) lines.push(`  font-size: ${global.font.size}px;`)
  if (global?.font?.color) lines.push(`  color: ${global.font.color};`)
  lines.push('}')

  lines.push('')
  lines.push('/* Global Background (fixed full-screen layer) */')
  const bg = global?.background
  if (bg?.gradient && Array.isArray(bg.colors) && bg.colors.length) {
    const gOp = bg.gradientOpacity ?? 100
    const lOp = bg.layerOpacity ?? 100
    lines.push(`/* Gradient: ${bg.colors.join(' → ')} */`)
    lines.push(`background-layer: linear-gradient(135deg, ${bg.colors.join(', ')});`)
    lines.push(`/* Gradient Opacity: ${gOp}% | Background Opacity: ${lOp}% */`)
    if (bg.glass) lines.push(`/* Glass Mask: panels use theme panel color + blur over gradient */`)
  } else if (bg?.color) {
    const effAlpha = cpEffectiveAlpha(bg.color, bg.opacity ?? 86)
    const pct = Math.round(effAlpha * 100)
    if (bg.glass) lines.push(`/* Glass Mask: panels = ${bg.color} @ ${pct}% + blur */`)
    const alpha = Math.round(effAlpha * 255).toString(16).padStart(2, '0')
    lines.push(`background-layer: ${bg.color}${alpha};`)
  } else {
    lines.push(`/* No background (native / transparent) */`)
  }

  lines.push('')
  lines.push('/* Area Styles */')
  for (const [area, config] of Object.entries(areas || {})) {
    if (!config?.enabled) continue
    lines.push(`/* ${area} */`)
    lines.push(`[data-area="${area}"] {`)
    if (config.font?.color) lines.push(`  color: ${config.font.color};`)
    if (config.font?.size) lines.push(`  font-size: ${config.font.size}px;`)
    if (config.background?.color) lines.push(`  background-color: ${config.background.color};`)
    if (config.border?.color || config.border?.width !== undefined) {
      const color = config.border?.color || '#000'
      const width = config.border?.width ?? 0
      lines.push(`  border: ${width}px solid ${color};`)
    }
    if (config.border?.radius !== undefined) lines.push(`  border-radius: ${config.border.radius}px;`)
    lines.push('}')
  }

  if (customCSS?.trim()) {
    lines.push('')
    lines.push('/* Custom CSS */')
    lines.push(customCSS)
  }

  return lines.join('\n')
}

/**
 * 样式编辑器主组件
 *
 * @param {Object} props
 * @param {Object} [props.theme] - 编辑时的主题（可选）
 * @param {Function} props.onSave - 保存回调，接收 styles 参数
 * @param {Function} props.onCancel - 取消回调
 * @param {boolean} [props.isNew=false] - 是否为新建模式（顶部显示保存按钮）
 */
function StyleEditor({ theme, onSave, onCancel, draftRef, isNew = false }) {
  const [activeTab, setActiveTab] = React.useState('global')
  const [draftStyles, setDraftStyles] = React.useState(() =>
    JSON.parse(JSON.stringify(theme?.styles || DEFAULT_STYLES))
  )

  // 将最新草稿暴露给外层（供面板顶部"Keep"按钮读取并保存）
  React.useEffect(() => {
    if (draftRef) draftRef.current = draftStyles
  }, [draftStyles, draftRef])

  // 生成预览 CSS
  const previewCSS = React.useMemo(() => generatePreviewCSS(draftStyles), [draftStyles])

  const handleChange = React.useCallback((category, property, value, isArea = false) => {
    setDraftStyles(prev => {
      const next = JSON.parse(JSON.stringify(prev))
      if (isArea) {
        const area = activeTab
        if (!next.areas[area]) next.areas[area] = {}
        if (!next.areas[area][category]) next.areas[area][category] = {}
        next.areas[area][category][property] = value
      } else {
        if (!next.global[category]) next.global[category] = {}
        next.global[category][property] = value
      }
      return next
    })
  }, [activeTab])

  const handleToggleEnabled = React.useCallback(() => {
    setDraftStyles(prev => {
      const next = JSON.parse(JSON.stringify(prev))
      const area = activeTab
      if (!next.areas[area]) next.areas[area] = {}
      next.areas[area].enabled = !next.areas[area].enabled
      return next
    })
  }, [activeTab])

  return React.createElement('div', { className: 'space-y-4' },
    // 标签栏
    React.createElement('div', { className: 'flex gap-1 border-b pb-2 overflow-x-auto' },
      TABS.map(tab =>
        React.createElement('button', {
          key: tab.id,
          onClick: () => setActiveTab(tab.id),
          className: `px-3 py-1 text-sm rounded whitespace-nowrap ${
            activeTab === tab.id ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
          }`
        }, tab.label)
      )
    ),

    // 内容区
    React.createElement('div', { className: 'space-y-4' },
      React.createElement(TabContent, {
        tabId: activeTab,
        draftStyles,
        onChange: handleChange,
        onToggleEnabled: handleToggleEnabled
      }),

      // CSS 预览
      React.createElement(CSSPreview, { css: previewCSS })
    )
  )
}

/**
 * 标签内容组件
 */
function TabContent({ tabId, draftStyles, onChange, onToggleEnabled }) {
  const isArea = tabId !== 'global'
  const config = isArea
    ? (draftStyles.areas[tabId] || {})
    : draftStyles.global

  const handlePropertyChange = (category, property, value) => {
    onChange(category, property, value, isArea)
  }

  return React.createElement('div', { className: 'space-y-4' },
    // 区域启用开关
    isArea && React.createElement('div', { className: 'flex items-center gap-2 p-3 bg-gray-50 rounded-lg' },
      React.createElement('input', {
        type: 'checkbox',
        id: 'enable-custom',
        checked: config.enabled || false,
        onChange: onToggleEnabled,
        className: 'w-4 h-4'
      }),
      React.createElement('label', { htmlFor: 'enable-custom', className: 'text-sm font-medium cursor-pointer' },
        'Enable custom styles for this area'
      )
    ),

    // 字体属性组
    React.createElement(PropertyGroup, {
      title: 'Font',
      category: 'font',
      config: config.font || {},
      metadata: STYLE_METADATA.font,
      onChange: handlePropertyChange,
      disabled: isArea && !config.enabled
    }),

    // 背景属性组（区域：单色；全局：渐变多色，见 GlobalBackgroundSection）
    React.createElement('div', { className: 'space-y-2' },
      React.createElement('h4', { className: 'font-medium text-sm text-gray-700 border-b pb-1' }, 'Background'),
      isArea
        ? React.createElement(PropertyGroup, {
            title: '',
            category: 'background',
            config: config.background || {},
            metadata: { color: STYLE_METADATA.background.color, glass: STYLE_METADATA.background.glass },
            onChange: handlePropertyChange,
            disabled: isArea && !config.enabled
          })
        : React.createElement(GlobalBackgroundSection, {
            config: config.background || {},
            onChange: handlePropertyChange
          })
    ),

    // 边框属性组
    React.createElement(PropertyGroup, {
      title: 'Border',
      category: 'border',
      config: config.border || {},
      metadata: STYLE_METADATA.border,
      onChange: handlePropertyChange,
      disabled: isArea && !config.enabled
    })
  )
}

/**
 * 属性组组件
 */
function PropertyGroup({ title, category, config, metadata, onChange, disabled }) {
  return React.createElement('div', {
    className: `space-y-2 ${disabled ? 'opacity-50 pointer-events-none' : ''}`
  },
    title && React.createElement('h4', { className: 'font-medium text-sm text-gray-700 border-b pb-1' }, title),
    React.createElement('div', { className: 'space-y-3' },
      Object.entries(metadata).map(([key, meta]) => {
        const value = config[key] !== undefined ? config[key] : meta.default

        // 复选框（如「启用渐变」「启用玻璃蒙板」）单独成行，标签在右侧
        if (meta.type === 'checkbox') {
          return React.createElement('label', {
            key,
            className: 'flex items-center gap-2 cursor-pointer select-none'
          },
            React.createElement('input', {
              type: 'checkbox',
              checked: !!value,
              onChange: (e) => onChange(category, key, e.target.checked),
              className: 'w-4 h-4'
            }),
            React.createElement('span', { className: 'text-xs text-gray-600' }, meta.label)
          )
        }

        return React.createElement('div', { key, className: 'flex items-center gap-3' },
          React.createElement('label', { className: 'w-24 text-xs text-gray-500 flex-shrink-0' }, meta.label),
          meta.type === 'color' && React.createElement(ColorPicker, {
            value,
            meta,
            onChange: (val) => onChange(category, key, val)
          }),
          meta.type === 'range' && React.createElement('div', { className: 'flex items-center gap-2 flex-1' },
            React.createElement('input', {
              type: 'range',
              min: meta.min,
              max: meta.max,
              value,
              onChange: (e) => onChange(category, key, Number(e.target.value)),
              className: 'flex-1'
            }),
            React.createElement('span', { className: 'text-xs text-gray-500 w-12 text-right font-mono' },
              `${value}${meta.unit || ''}`
            )
          ),
          meta.type === 'text' && React.createElement('input', {
            type: 'text',
            value,
            onChange: (e) => onChange(category, key, e.target.value),
            className: 'flex-1 px-2 py-1 text-sm border rounded'
          })
        )
      })
    )
  )
}

/**
 * 复选框行（与 PropertyGroup 内渲染一致）
 */
function renderCheckbox(meta, checked, onToggle) {
  return React.createElement('label', { className: 'flex items-center gap-2 cursor-pointer select-none' },
    React.createElement('input', {
      type: 'checkbox',
      checked: !!checked,
      onChange: (e) => onToggle(e.target.checked),
      className: 'w-4 h-4'
    }),
    React.createElement('span', { className: 'text-xs text-gray-600' }, meta.label)
  )
}

// 范围滑块（透明度等数值设置）
function renderRange(meta, value, onInput) {
  const v = value ?? meta.default ?? 0
  return React.createElement('div', { className: 'space-y-1' },
    React.createElement('div', { className: 'flex items-center justify-between' },
      React.createElement('span', { className: 'text-xs text-gray-600' }, meta.label),
      React.createElement('span', { className: 'text-xs font-mono text-gray-400' }, `${v}${meta.unit || ''}`)
    ),
    React.createElement('input', {
      type: 'range',
      min: meta.min ?? 0,
      max: meta.max ?? 100,
      step: meta.step ?? 1,
      value: v,
      onChange: (e) => onInput(Number(e.target.value)),
      className: 'w-full'
    })
  )
}

// 由单色派生一个更深的颜色（旧主题迁移用）
function cpDarkenHex(hex, amt) {
  const clean = (hex || '').replace('#', '').slice(0, 6)
  if (clean.length < 6) return hex
  const num = parseInt(clean, 16)
  let r = (num >> 16) & 0xff, g = (num >> 8) & 0xff, b = num & 0xff
  r = Math.max(0, Math.round(r * (1 - amt)))
  g = Math.max(0, Math.round(g * (1 - amt)))
  b = Math.max(0, Math.round(b * (1 - amt)))
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

/**
 * 全局背景编辑区
 *
 * - Enable Gradient 置于最上方；勾选后才显示「渐变颜色」多色编辑器
 * - 颜色可多选，按数组顺序构建 linear-gradient（135deg）
 * - 每个颜色都带透明度（内嵌 alpha），与 Font / Border 颜色一致
 * - 未勾选 Gradient 时不显示任何背景色控件（恢复原生 / 透明，玻璃作用于透明底）
 * - Glass Mask 独立于渐变，始终显示
 */
// 单个渐变颜色行：仅显示色块；鼠标移上去后在色块右侧贴一个删除方块
function GradientColorRow({ color, hasOpacity, canRemove, onColorChange, onRemove }) {
  const [hover, setHover] = React.useState(false)
  return React.createElement('div', {
    className: 'relative inline-flex items-center',
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false)
  },
    React.createElement(ColorPicker, {
      value: color,
      meta: { hasOpacity, compact: true },
      onChange: onColorChange
    }),
    canRemove && hover && React.createElement('button', {
      onClick: onRemove,
      title: 'Remove color',
      'aria-label': 'Remove color',
      className: 'ml-1 w-5 h-5 rounded-sm flex items-center justify-center text-xs leading-none text-white',
      style: { backgroundColor: '#ef4444' }
    }, '×')
  )
}

function GlobalBackgroundSection({ config, onChange }) {
  const bg = config || {}
  const gradient = !!bg.gradient

  // 多色数组：优先用已存 colors；旧单色主题迁移为 [color, darker]；否则用默认单色
  let colors
  if (Array.isArray(bg.colors) && bg.colors.length) {
    colors = bg.colors
  } else if (bg.color) {
    colors = [bg.color, cpDarkenHex(bg.color, 0.4)]
  } else {
    colors = ['#191c22db']
  }

  const setVal = (key, val) => onChange('background', key, val)
  const setColorAt = (idx, val) => setVal('colors', colors.map((c, i) => (i === idx ? val : c)))
  const addColor = () => setVal('colors', [...colors, '#3a4150db'])
  const removeColor = (idx) => setVal('colors', colors.filter((_, i) => i !== idx))

  return React.createElement('div', { className: 'space-y-2' },
    // 1. Enable Gradient（置顶）
    renderCheckbox(STYLE_METADATA.background.gradient, gradient, (v) => setVal('gradient', v)),

    // 2. 渐变颜色（仅勾选后显示）：只显示色块，hover 出现删除方块
    gradient && React.createElement('div', { className: 'space-y-2 pl-2 border-l border-gray-200 ml-1' },
      React.createElement('div', { className: 'text-xs text-gray-500' }, 'Gradient Colors (top → bottom, in order)'),
      React.createElement('div', { className: 'flex flex-wrap items-center gap-2' },
        ...colors.map((c, i) =>
          React.createElement(GradientColorRow, {
            key: i,
            color: c,
            hasOpacity: true,
            canRemove: colors.length > 1,
            onColorChange: (v) => setColorAt(i, v),
            onRemove: () => removeColor(i)
          })
        )
      ),
      React.createElement('button', {
        onClick: addColor,
        className: 'px-2 py-1 text-xs rounded border border-gray-300 text-gray-600 hover:bg-gray-100'
      }, '+ Add Color'),
      // 整体透明度 + 整层透明度
      React.createElement('div', { className: 'pt-1 space-y-2' },
        renderRange({ label: 'Gradient Opacity', min: 0, max: 100, unit: '%', default: 100 }, bg.gradientOpacity ?? 100, (v) => setVal('gradientOpacity', v)),
        renderRange({ label: 'Background Opacity', min: 0, max: 100, unit: '%', default: 100 }, bg.layerOpacity ?? 100, (v) => setVal('layerOpacity', v))
      )
    ),

    // 3. Glass Mask（始终显示，独立于渐变）
    renderCheckbox(STYLE_METADATA.background.glass, !!bg.glass, (v) => setVal('glass', v))
  )
}

/**
 * CSS 预览组件
 */
function CSSPreview({ css }) {
  return React.createElement('div', { className: 'space-y-2' },
    React.createElement('h4', { className: 'font-medium text-sm text-gray-700' }, 'CSS Preview'),
    React.createElement('textarea', {
      readOnly: true,
      value: css,
      className: 'w-full h-40 p-3 text-xs font-mono bg-gray-900 text-green-400 rounded resize-none',
      style: { fontFamily: 'monospace', fontSize: '11px' }
    })
  )
}

// ── 颜色选择器辅助函数（自包含，无任何外部 CDN / 第三方库依赖） ──

// 解析颜色值 -> { hex: '#RRGGBB', alpha: 0..1 }
function cpParseColor(value) {
  let hex = '#ffffff'
  let alpha = 1
  if (value && typeof value === 'string' && value[0] === '#') {
    let h = value.slice(1)
    if (h.length === 3 || h.length === 4) {
      // #RGB / #RGBA 简写展开
      h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2] + (h[3] || '')
    }
    if (h.length >= 8) {
      alpha = parseInt(h.slice(6, 8), 16) / 255
    }
    if (/^[0-9a-fA-F]{6}$/.test(h.slice(0, 6))) {
      hex = '#' + h.slice(0, 6)
    }
  }
  return { hex, alpha }
}

// 组合 hex + alpha -> '#RRGGBBAA'
function cpToHex8(hex, alpha) {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
  return `${hex}${a.toString(16).padStart(2, '0')}`
}

// 取有效透明度（0..1）：优先 8 位 hex 内嵌 alpha，否则回退到 fallbackPct
function cpEffectiveAlpha(value, fallbackPct = 86) {
  const clean = (value || '').replace('#', '')
  if (clean.length >= 8) return parseInt(clean.substring(6, 8), 16) / 255
  return (fallbackPct ?? 86) / 100
}

// 棋盘格背景（透明色通用指示图案，非主题色，固定中性灰）
function cpCheckerboard() {
  return {
    backgroundImage:
      'linear-gradient(45deg, #c8c8c8 25%, transparent 25%),' +
      'linear-gradient(-45deg, #c8c8c8 25%, transparent 25%),' +
      'linear-gradient(45deg, transparent 75%, #c8c8c8 75%),' +
      'linear-gradient(-45deg, transparent 75%, #c8c8c8 75%)',
    backgroundSize: '8px 8px',
    backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0'
  }
}

function cpPopoverStyle() {
  return {
    width: '280px',
    top: 'calc(100% + 4px)',
    left: '0',
    boxShadow: '0 4px 24px rgba(0,0,0,0.15), 0 0 1px rgba(0,0,0,0.1)',
    border: '1px solid rgba(0,0,0,0.08)'
  }
}

/**
 * 颜色选择器组件（自包含实现，无外部依赖）
 *
 * 同时支持：
 * - 颜色选择：原生 <input type="color">，跨平台一致的取色体验
 * - 透明度调整：meta.hasOpacity 为 true 时显示 Alpha 滑块，二者可在同一面板内同时调整
 *
 * 输出格式：hasOpacity 时返回 #RRGGBBAA，否则返回 #RRGGBB
 */
function ColorPicker({ value, meta, onChange, compact }) {
  const hasOpacity = !!meta?.hasOpacity

  const parsed = React.useMemo(() => cpParseColor(value), [value])
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef(null)
  const justClickedRef = React.useRef(false)

  const finalValue = hasOpacity ? cpToHex8(parsed.hex, parsed.alpha) : parsed.hex

  const emit = React.useCallback((hex, alpha) => {
    onChange(hasOpacity ? cpToHex8(hex, alpha) : hex)
  }, [hasOpacity, onChange])

  // 手动输入 hex（支持 6 位 / 8 位），仅在合法时才提交，避免中途输入破坏状态
  const handleHexInput = (e) => {
    const v = e.target.value.trim()
    if (!/^#[0-9a-fA-F]{6}$/.test(v) && !/^#[0-9a-fA-F]{8}$/.test(v)) return
    const p = cpParseColor(v)
    emit(p.hex, hasOpacity ? p.alpha : 1)
  }

  // 点击外部关闭
  React.useEffect(() => {
    if (!isOpen) return
    const onDocDown = (e) => {
      if (justClickedRef.current) {
        justClickedRef.current = false
        return
      }
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocDown)
    return () => document.removeEventListener('mousedown', onDocDown)
  }, [isOpen])

  const handlePreviewClick = (e) => {
    e.stopPropagation()
    justClickedRef.current = true
    setIsOpen((prev) => !prev)
  }

  const alphaPct = Math.round(parsed.alpha * 100)

  return React.createElement('div', { className: 'relative flex items-center gap-3 flex-1' },
    // 预览按钮（棋盘格透明指示 + 颜色叠加）
    React.createElement('div', {
      className: 'w-8 h-8 rounded border overflow-hidden cursor-pointer flex-shrink-0 relative',
      onClick: handlePreviewClick,
      role: 'button',
      tabIndex: 0,
      'aria-label': 'Select color'
    },
      React.createElement('div', { className: 'absolute inset-0', style: cpCheckerboard() }),
      React.createElement('div', {
        className: 'absolute inset-0',
        style: { backgroundColor: parsed.hex, opacity: hasOpacity ? parsed.alpha : 1 }
      })
    ),
    // 颜色值文本（compact 模式隐藏，仅显示色块）
    !compact && React.createElement('span', {
      className: 'text-xs text-gray-400 font-mono flex-shrink-0',
      style: { minWidth: '74px' }
    }, finalValue),

    // Popover
    isOpen && React.createElement('div', {
      ref: containerRef,
      className: 'absolute z-50 bg-white rounded-lg p-4 space-y-3',
      style: cpPopoverStyle()
    },
      // 颜色选择（原生拾色器）
      React.createElement('div', { className: 'flex items-center gap-2' },
        React.createElement('input', {
          type: 'color',
          value: parsed.hex,
          onChange: (e) => emit(e.target.value, hasOpacity ? parsed.alpha : 1),
          className: 'w-10 h-10 cursor-pointer bg-transparent border-0 p-0',
          'aria-label': 'Color'
        }),
        React.createElement('input', {
          type: 'text',
          value: finalValue,
          onChange: handleHexInput,
          spellCheck: false,
          className: 'flex-1 px-2 py-1 text-xs font-mono border rounded'
        })
      ),

      // 透明度滑块（仅 hasOpacity 时显示，与颜色选择同时存在）
      hasOpacity && React.createElement('div', { className: 'space-y-1' },
        React.createElement('div', { className: 'flex items-center justify-between text-xs text-gray-500' },
          React.createElement('span', null, 'Opacity'),
          React.createElement('span', { className: 'font-mono' }, `${alphaPct}%`)
        ),
        React.createElement('div', { className: 'flex items-center gap-2' },
          React.createElement('input', {
            type: 'range',
            min: 0,
            max: 100,
            step: 1,
            value: alphaPct,
            onChange: (e) => emit(parsed.hex, Number(e.target.value) / 100),
            className: 'flex-1'
          }),
          // 透明度预览条
          React.createElement('div', {
            className: 'w-6 h-6 rounded border overflow-hidden relative flex-shrink-0',
            style: cpCheckerboard()
          }, React.createElement('div', {
            className: 'absolute inset-0',
            style: { backgroundColor: parsed.hex, opacity: parsed.alpha }
          }))
        )
      ),

      // 确定按钮
      React.createElement('div', { className: 'flex justify-end pt-2 border-t' },
        React.createElement('button', {
          className: 'px-3 py-1.5 rounded text-xs font-medium',
          style: { backgroundColor: '#9fb6e4', color: '#ffffff' },
          onClick: () => setIsOpen(false)
        }, 'OK')
      )
    )
  )
}

// --- theme-manager.js ---
/**
 * 主题管理器
 *
 * 负责：
 * - 主题的 CRUD（增删改查）
 * - 主题配置的持久化（通过 PluginStorage）
 * - 主题切换事件通知
 */


const STORAGE_KEY = 'dream-skin:themes'
const ACTIVE_THEME_KEY = 'dream-skin:active-theme'
const GLOBAL_RULES_KEY = 'dream-skin:global-rules'
const THEMES_DIR_KEY = 'dream-skin:themes-dir'
const PLUGIN_ID = 'hermes-dream-skin'

/**
 * 读取目录并归一化为入口数组。
 * 依据宿主 hermesDesktop.readDir 的真实签名（见桌面 app src/global.d.ts）：
 *   readDir(path) => Promise<{ entries: { name: string; path: string; isDirectory: boolean }[]; error?: string }>
 * 注意：错误放在 result.error 字段（不抛异常），每个入口自带 name / path / isDirectory 布尔。
 *
 * @param {object} hd window.hermesDesktop
 * @param {string} dir 绝对路径（正斜杠）
 * @returns {Promise<Array<{name,path,isDirectory}>>}
 */
async function readDirEntries(hd, dir) {
  try {
    const result = await hd.readDir(dir)
    if (!result || result.error) {
      console.warn('[Dream Skin] readDir 返回错误（跳过）：', dir, result && result.error)
      return []
    }
    return Array.isArray(result.entries) ? result.entries : []
  } catch (e) {
    console.warn('[Dream Skin] readDir 异常（路径可能不存在）：', dir, e)
    return []
  }
}

/** 读取文本文件，依据 readFileText 真实签名：Promise<{ text: string; ... }> */
async function readFileText(hd, filePath) {
  const result = await hd.readFileText(filePath)
  return result && typeof result.text === 'string' ? result.text : ''
}

/**
 * 解析默认主题目录：插件安装目录下的 themes/。
 *   C:/Users/<user>/AppData/Local/hermes/desktop-plugins/hermes-dream-skin/themes
 *
 * ⚠️ 重要：插件作为 ESM 在 Electron 渲染进程 realm 求值（见桌面 app
 * apps/desktop/src/contrib/runtime-loader.ts），默认 contextIsolation 下**没有**
 * Node `process`，且 global.d.ts 未声明 process —— 故 `process.env.USERNAME` 在运行时
 * 大概率取不到。`getPathForFile` 只收 File 对象、`themes` 命名空间是 Marketplace 下载器、
 * 插件 ctx 不暴露路径字段，均无法给出 userData 路径。
 * 因此这里仅作「零成本尽力尝试」：能拿到用户名就用真实路径，拿不到返回 null，
 * 由调用方回退到「用户手动选择」——绝不返回字面量占位（避免用无效路径静默 readDir
 * 失败、列表永远为空）。
 */
async function resolveDefaultThemesDir() {
  try {
    if (typeof process !== 'undefined' && (process.env.USERNAME || process.env.USER)) {
      const user = process.env.USERNAME || process.env.USER
      return `C:/Users/${user}/AppData/Local/hermes/desktop-plugins/${PLUGIN_ID}/themes`
    }
  } catch (_) { /* process 不可用，忽略 */ }
  return null
}

class ThemeManager {
  constructor(ctx) {
    this.ctx = ctx
    this.themes = new Map()
    this.activeThemeId = null
    this.globalRules = null
    this.listeners = new Set()
  }

  /**
   * 解析当前生效的主题目录（用户可在面板中修改，持久化到 storage）。
   * 未设置且无法自动推导出默认路径时，返回 null（不持久化字面量占位），
   * 由面板 UI 引导用户点击「选择文件夹」。
   */
  async getThemesDir() {
    let dir = null
    try { dir = this.ctx.storage.get(THEMES_DIR_KEY, null) } catch (e) {}
    if (dir && typeof dir === 'string' && dir.trim() && !dir.includes('<user>')) {
      return dir.trim().replace(/\\/g, '/')
    }
    const def = await resolveDefaultThemesDir()
    if (def) {
      try { this.ctx.storage.set(THEMES_DIR_KEY, def) } catch (e) {}
      return def
    }
    // 无法解析（如渲染进程无 process.env）：不持久化无效路径，返回 null
    return null
  }

  /** 设置主题目录（持久化） */
  setThemesDir(dir) {
    const clean = (dir || '').trim().replace(/\\/g, '/')
    if (!clean) return
    try { this.ctx.storage.set(THEMES_DIR_KEY, clean) } catch (e) {}
  }

  /**
   * 新建主题（统一入口：合并原「Add Theme」与「新建主题文件夹」）。
   * 始终在主题目录下创建 themes/<名称>/theme.json（真实落盘），用户可在文件管理器看到该文件夹。
   * 背景图可选：传入则写入 theme.json 的 image 字段（base64 data URL，与 scanFolderSeeds 的
   * data: 解析路径一致，无需二进制写盘 IPC）；样式可选：传入则一并写入。
   * 依赖宿主 IPC：hermesDesktop.writeTextFile（应递归创建父目录）。
   *
   * @param {object} opts { name, imageFile?, styles?, appearance?, description? }
   * @returns {Promise<object>} 重新扫描后内存中的主题对象
   */
  async createTheme(opts = {}) {
    const hd = window.hermesDesktop
    if (!hd || typeof hd.writeTextFile !== 'function') {
      throw new Error('当前宿主不支持写文件（writeTextFile 不可用）')
    }
    const dir = await this.getThemesDir()

    // 规范化名称：去除路径分隔符与非法字符，限制长度（防路径穿越）
    const safe = (opts.name || '').trim()
      .replace(/[\\/:*?"<>|]/g, '_')
      .replace(/\s+/g, ' ')
      .replace(/^\.+$/, '')
      .slice(0, 60)
    if (!safe) throw new Error('主题名不能为空或仅含非法字符')

    // 检查同名文件夹是否已存在（readDir 入口自带 isDirectory + name）
    const entries = await readDirEntries(hd, dir)
    if (entries.some(e => e.isDirectory && e.name === safe)) {
      throw new Error(`文件夹 "${safe}" 已存在，请换一个名称`)
    }

    // 背景图 → base64 data URL（可空）
    let image = null
    if (opts.imageFile) {
      image = await this.fileToDataUrl(opts.imageFile)
    }

    const themeId = `theme-${Date.now()}`
    const themeJson = {
      schemaVersion: 1,
      id: themeId,
      name: safe,
      description: opts.description || '',
      appearance: opts.appearance || 'auto',
      art: { focusX: 0.5, focusY: 0.35, safeArea: 'center', taskMode: 'ambient' },
      image,
      styles: opts.styles ? JSON.parse(JSON.stringify(opts.styles)) : JSON.parse(JSON.stringify(DEFAULT_STYLES))
    }

    const folderPath = `${dir}/${safe}`
    const filePath = `${folderPath}/theme.json`
    try {
      await hd.writeTextFile(filePath, JSON.stringify(themeJson, null, 2))
    } catch (e) {
      // writeTextFile 要求父目录存在（不自动创建）。openDir(path) 会「created if missing」，
      // 用它兜底建目录再重试一次。若宿主无 openDir，则上抛原始错误。
      if (hd.openDir) {
        try {
          await hd.openDir(folderPath)
          await hd.writeTextFile(filePath, JSON.stringify(themeJson, null, 2))
        } catch (e2) {
          throw new Error(`写入文件失败：${e2.message}`)
        }
      } else {
        throw new Error(`写入文件失败（父目录不存在且宿主无 openDir）：${e.message}`)
      }
    }

    // 重新扫描，让新主题进入内存并被列表发现
    await this.reloadFromStorage()
    return this.themes.get(themeId) || { id: themeId, name: safe, styles: themeJson.styles }
  }

  /**
   * 运行时扫描主题目录：把每个含 theme.json 的子文件夹作为「种子」读入。
   * 背景图：优先 theme.json 的 image 字段，否则自动探测目录内图片文件。
   * 依赖宿主 IPC：readDir / readFileText / readFileDataUrl（均为异步，路径须绝对）。
   */
  async scanFolderSeeds(themesDir) {
    if (!themesDir || typeof themesDir !== 'string' || !themesDir.trim()) {
      console.warn('[Dream Skin] 未设置主题目录，跳过扫描（请在面板「选择文件夹」指定 themes 目录）')
      return []
    }
    const hd = window.hermesDesktop
    if (!hd || typeof hd.readDir !== 'function') {
      console.warn('[Dream Skin] hermesDesktop.readDir unavailable; cannot scan themes dir')
      return []
    }
    const seeds = []
    // readDir 真实返回 { entries: {name, path, isDirectory}[], error? }
    const entries = await readDirEntries(hd, themesDir)
    const subDirs = entries.filter(e => e.isDirectory && e.name).map(e => e.name)
    for (const name of subDirs) {
      const dir = `${themesDir}/${name}`
      try {
        const raw = await readFileText(hd, `${dir}/theme.json`)
        if (!raw) continue
        const theme = JSON.parse(raw)

        // 背景图解析：theme.json 的 image 若为 data: URL 则直接用；否则按文件名探测目录内图片
        let image = null
        if (theme.image && String(theme.image).startsWith('data:')) {
          image = theme.image
        } else {
          let imgPath = theme.image ? `${dir}/${theme.image}` : null
          if (!imgPath) {
            const files = await readDirEntries(hd, dir)
            const img = files.find(f => !f.isDirectory && /\.(jpe?g|png|webp|gif|avif)$/i.test(f.name))
            if (img) imgPath = `${dir}/${img.name}`
          }
          if (imgPath) {
            try { image = await hd.readFileDataUrl(imgPath) }
            catch (err) { console.warn('[Dream Skin] image load failed:', imgPath, err) }
          }
        }

        seeds.push({
          id: theme.id || `preset-${name}`,
          name: theme.name || name,
          appearance: theme.appearance || 'auto',
          art: theme.art || {},
          image,
          description: theme.description || '',
          styles: theme.styles || JSON.parse(JSON.stringify(DEFAULT_STYLES)),
          folderPath: dir,
          createdAt: Date.now()
        })
      } catch (err) {
        console.warn('[Dream Skin] skip invalid theme dir:', dir, err)
      }
    }
    return seeds
  }

  /** 从 PluginStorage 加载主题配置（并合并磁盘 seeds 作为预设来源） */
  async loadFromStorage() {
    const themesDir = await this.getThemesDir()
    const seeds = await this.scanFolderSeeds(themesDir)

    try {
      const stored = this.ctx.storage.get(STORAGE_KEY, null)
      if (stored) {
        const themes = JSON.parse(stored)
        this.themes = new Map(Object.entries(themes))
        // Backward compatibility: add empty styles if missing
        for (const [_, theme] of this.themes) {
          if (!theme.styles) {
            theme.styles = JSON.parse(JSON.stringify(DEFAULT_STYLES))
          }
        }

        // 用磁盘 seeds 同步预设：preset-* 跟踪磁盘最新配色（调色板 customCSS），
        // 用户在某预设上的 per-area / global 自定义必须保留——否则重载会丢失。
        // 非预设（theme-* / 用户拖入的文件夹）已存在则保留原样，不存在则加入。
        for (const seed of seeds) {
          const existing = this.themes.get(seed.id)
          if (existing) {
            // 同步磁盘路径，确保后续样式回写能定位到文件夹（preset 与 非 preset 都需要）
            if (seed.folderPath && !existing.folderPath) existing.folderPath = seed.folderPath
            if (!seed.id.startsWith('preset-')) continue
            const seedAreas = seed.styles?.areas || {}
            const userAreas = existing.styles?.areas || {}
            const mergedAreas = {}
            for (const key of new Set([...Object.keys(seedAreas), ...Object.keys(userAreas)])) {
              mergedAreas[key] = { ...(seedAreas[key] || {}), ...(userAreas[key] || {}) }
            }
            existing.styles = {
              ...existing.styles,
              customCSS: seed.styles?.customCSS || existing.styles?.customCSS,
              global: { ...(seed.styles?.global || {}), ...(existing.styles?.global || {}) },
              areas: mergedAreas
            }
            if (seed.image && !existing.image) existing.image = seed.image
          } else {
            this.themes.set(seed.id, { ...seed })
          }
        }
      } else {
        // 首次运行（无 storage）：直接以磁盘 seeds 作为初始主题集
        for (const seed of seeds) {
          this.themes.set(seed.id, { ...seed })
        }
      }
    } catch (e) {
      console.warn('[Dream Skin] Failed to load themes from storage:', e)
    }

    try {
      this.activeThemeId = this.ctx.storage.get(ACTIVE_THEME_KEY, null)
    } catch (e) {
      console.warn('[Dream Skin] Failed to load active theme:', e)
    }

    // 全局规则：独立于主题，插件启动时即生效。storage 无则回退默认。
    try {
      const storedGlobal = this.ctx.storage.get(GLOBAL_RULES_KEY, null)
      this.globalRules = storedGlobal || DEFAULT_GLOBAL_CSS
    } catch (e) {
      console.warn('[Dream Skin] Failed to load global rules:', e)
      this.globalRules = DEFAULT_GLOBAL_CSS
    }
  }

  /** 获取当前全局规则 CSS */
  getGlobalRules() {
    return this.globalRules || DEFAULT_GLOBAL_CSS
  }

  /** 设置并持久化全局规则 CSS */
  setGlobalRules(css) {
    this.globalRules = css || DEFAULT_GLOBAL_CSS
    try {
      this.ctx.storage.set(GLOBAL_RULES_KEY, this.globalRules)
    } catch (e) {
      console.warn('[Dream Skin] Failed to save global rules:', e)
    }
  }

  /** 重新从 PluginStorage 加载主题（清空内存状态后重载，并重扫磁盘目录） */
  async reloadFromStorage() {
    this.themes = new Map()
    this.activeThemeId = null
    await this.loadFromStorage()
  }

  /**
   * 恢复系统默认状态：清空自定义主题，仅保留磁盘目录里的预设种子并设为激活。
   * 安全护栏：若磁盘扫描未返回任何预设（主题目录缺失 / readDir 形态未知 / 未部署 themes 文件夹），
   * 不破坏当前已加载的主题列表（避免点一下就把列表清空且无法恢复），仅回退全局规则。
   */
  /**
   * 恢复 app 原生状态：移除所有 hermes-dream-skin 的样式修改，
   * 不套用任何主题（html 不再带 dream-skin-active，注入的 style 全部移除）。
   * 预设列表保留，用户可随时再选主题重新启用。
   */
  async restoreSystemDefaults() {
    // 取消激活：清空当前激活主题
    this.activeThemeId = null

    // 全局规则重置为默认（下次套用主题时生效；当前 native 状态下 global 规则无作用域不生效）
    this.globalRules = DEFAULT_GLOBAL_CSS
    try {
      this.ctx.storage.set(GLOBAL_RULES_KEY, DEFAULT_GLOBAL_CSS)
    } catch (e) {
      console.warn('[Dream Skin] Failed to save global rules:', e)
    }

    // 清除已激活主题的持久化，使下次插件启动不再自动套用任何主题
    try {
      if (typeof this.ctx.storage.delete === 'function') {
        this.ctx.storage.delete(ACTIVE_THEME_KEY)
      } else {
        this.ctx.storage.set(ACTIVE_THEME_KEY, null)
      }
    } catch (e) {
      console.warn('[Dream Skin] Failed to clear active theme:', e)
    }

    // 主题列表（预设）保留，仅清空内存中的激活标记
    this.saveToStorage()
  }

  /** 保存主题配置到 PluginStorage */
  saveToStorage() {
    try {
      const themesObj = Object.fromEntries(this.themes)
      this.ctx.storage.set(STORAGE_KEY, JSON.stringify(themesObj))
    } catch (e) {
      console.warn('[Dream Skin] Failed to save themes:', e)
    }

    if (this.activeThemeId) {
      this.ctx.storage.set(ACTIVE_THEME_KEY, this.activeThemeId)
    }
  }

  /** 添加主题 */
  addTheme(theme) {
    if (!theme.id || !theme.name) {
      throw new Error('Theme must have id and name')
    }

    this.themes.set(theme.id, theme)
    this.saveToStorage()
  }

  /** 删除主题 */
  removeTheme(themeId) {
    this.themes.delete(themeId)

    if (this.activeThemeId === themeId) {
      this.activeThemeId = null
    }

    this.saveToStorage()
  }

  /** 获取所有主题 */
  getAllThemes() {
    return Array.from(this.themes.values())
  }

  /** 获取当前激活的主题 */
  getActiveTheme() {
    if (!this.activeThemeId) return null
    return this.themes.get(this.activeThemeId) || null
  }

  /** 设置激活主题 */
  setActiveTheme(themeId) {
    if (!this.themes.has(themeId)) {
      throw new Error(`Theme not found: ${themeId}`)
    }

    this.activeThemeId = themeId
    this.saveToStorage()

    // 通知监听器
    const theme = this.themes.get(themeId)
    this.listeners.forEach(listener => listener(theme))
  }

  /** 监听主题变化 */
  onThemeChange(listener) {
    this.listeners.add(listener)

    // 返回取消监听的函数
    return () => this.listeners.delete(listener)
  }

  /**
   * 将主题回写磁盘 theme.json（仅当主题有 folderPath，即来源于磁盘文件夹）。
   * 写 styles + 元数据（name/description/appearance/art）；用户主题（非 preset）一并回写
   * image（base64 data URL），使 theme.json 自包含。preset 不写 image，仍走目录自动探测。
   * 无 folderPath 的纯 storage 主题跳过，仅保留内存/Storage。
   */
  async persistThemeToDisk(theme) {
    const hd = window.hermesDesktop
    if (!theme || !theme.folderPath) return false
    if (!hd || typeof hd.writeTextFile !== 'function') return false
    const themeJson = {
      schemaVersion: theme.schemaVersion || 1,
      id: theme.id,
      name: theme.name,
      description: theme.description || '',
      appearance: theme.appearance || 'auto',
      art: theme.art || { focusX: 0.5, focusY: 0.35, safeArea: 'center', taskMode: 'ambient' },
      styles: theme.styles,
      // 用户主题（非 preset）回写 image，保持 theme.json 自包含；preset 仍走目录自动探测
      image: (!theme.id.startsWith('preset-') && theme.image) ? theme.image : undefined
    }
    try {
      await hd.writeTextFile(`${theme.folderPath}/theme.json`, JSON.stringify(themeJson, null, 2))
      return true
    } catch (e) {
      console.warn('[Dream Skin] persist theme to disk failed:', e)
      return false
    }
  }

  /** 更新主题的样式配置（并回写磁盘，若该主题来源于文件夹） */
  async updateThemeStyles(themeId, styles) {
    const theme = this.themes.get(themeId)
    if (!theme) throw new Error(`Theme not found: ${themeId}`)

    theme.styles = styles
    this.saveToStorage()
    // 回写磁盘（无 folderPath 的主题静默跳过，仅存 Storage；customCSS 由 StyleEditor 保留，不会丢失）
    await this.persistThemeToDisk(theme)

    // 如果这是当前激活的主题，通知监听器重新应用
    if (this.activeThemeId === themeId) {
      const updatedTheme = this.themes.get(themeId)
      this.listeners.forEach(listener => listener(updatedTheme))
    }
  }

  /** 更新主题的背景图片 */
  async updateThemeImage(themeId, imageFile) {
    const theme = this.themes.get(themeId)
    if (!theme) throw new Error(`Theme not found: ${themeId}`)

    // 将新图片转为 data URL 并写回主题
    const imageDataUrl = await this.fileToDataUrl(imageFile)
    theme.image = imageDataUrl
    this.saveToStorage()
    // 同步落盘（用户主题会把 image 写入 theme.json，自包含）
    await this.persistThemeToDisk(theme)

    // 如果这是当前激活的主题，通知监听器重新应用
    if (this.activeThemeId === themeId) {
      const updatedTheme = this.themes.get(themeId)
      this.listeners.forEach(listener => listener(updatedTheme))
    }
  }

  /** 文件转 Data URL */
  fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
}

// --- css-injector.js ---
/**
 * CSS 注入器
 *
 * 负责：
 * - 创建和管理动态 CSS 样式标签
 * - 根据主题配置生成 CSS
 * - 注入到 DOM 中
 * - 支持主题切换时的清理和重新注入
 */


const STYLE_ID = 'hermes-dream-skin-style'
const GLOBAL_ID = 'hermes-dream-skin-global'
const CHROME_ID = 'hermes-dream-skin-chrome'
const CHROME_GRAD_ID = 'hermes-dream-skin-chrome-grad'

class CSSInjector {
  constructor() {
    this.currentTheme = null
    this.styleEl = null
    this.globalEl = null
    this.chromeEl = null
    this.gradientEl = null
  }

  init() {
    // 初始化时检查是否有已注入的样式
    this.styleEl = document.getElementById(STYLE_ID)
    this.globalEl = document.getElementById(GLOBAL_ID)
    this.chromeEl = document.getElementById(CHROME_ID)
    this.gradientEl = document.getElementById(CHROME_GRAD_ID)
  }

  /**
   * 应用主题
   * @param {Object} theme - 主题配置
   */
  applyTheme(theme) {
    if (!theme) {
      this.removeTheme()
      return
    }

    this.currentTheme = theme

    // 生成 CSS
    const css = this.generateCSS(theme)

    // 注入或更新样式
    this.injectStyle(css)

    // 注入 chrome 层（用于背景图覆盖）
    this.injectChrome(theme)

    console.log('[Dream Skin] Theme applied:', theme.name)
  }

  /**
   * 生成主题 CSS
   */
  generateCSS(theme) {
    // 如果主题有 styles 字段，使用新的结构化生成方式
    if (theme.styles) {
      return this.generateStructuredCSS(theme)
    }

    // 否则使用传统方式生成
    return this.generateLegacyCSS(theme)
  }

  /**
   * 传统 CSS 生成方式（向后兼容）
   */
  generateLegacyCSS(theme) {
    const { art = {} } = theme
    const focusX = art.focusX ?? 0.5
    const focusY = art.focusY ?? 0.35
    const safeArea = art.safeArea || 'center'
    const taskMode = art.taskMode || 'ambient'

    return `
      /* Hermes Dream Skin - ${theme.name} */
      :root {
        --dream-skin-art: url("${theme.image}");
        --dream-skin-focus-x: ${focusX};
        --dream-skin-focus-y: ${focusY};
        --dream-skin-safe-area: ${safeArea};
        --dream-skin-task-mode: ${taskMode};
      }

      /* 主内容区背景（legacy 路径：无 styles 的旧主题） */
      html.dream-skin-active [data-tree-group="grp-main"] {
        background-image: var(--dream-skin-art) !important;
        background-size: cover !important;
        background-position: ${Math.round(focusX * 100)}% ${Math.round(focusY * 100)}% !important;
        background-repeat: no-repeat !important;
        background-attachment: fixed !important;
      }

      /* 侧边栏半透明背景 */
      html.dream-skin-active [data-tree-group="grp-sessions"] {
        background: color-mix(in srgb, var(--ui-bg-sidebar) 85%, transparent) !important;
        backdrop-filter: blur(12px) saturate(1.05) !important;
      }

      /* 聊天区域半透明遮罩，确保文字可读性 */
      html.dream-skin-active [data-slot="aui_thread-viewport"] {
        background: color-mix(in srgb, var(--ui-bg-editor) 92%, transparent) !important;
      }

      /* 消息气泡增强可读性 */
      html.dream-skin-active [data-role="user"],
      html.dream-skin-active [data-slot="aui_assistant-message-root"] {
        background: color-mix(in srgb, var(--ui-bg-bubble) 95%, transparent) !important;
        backdrop-filter: blur(4px) !important;
      }

      /* Composer 区域半透明 */
      html.dream-skin-active [data-slot="composer-surface"] {
        background: color-mix(in srgb, var(--ui-bg-chrome) 90%, transparent) !important;
        backdrop-filter: blur(14px) saturate(1.06) !important;
      }

      /* 首页 Hero 区域背景图 */
      html.dream-skin-active .dream-home > div:first-child > div:first-child > div:first-child {
        background-image: var(--dream-skin-art) !important;
        background-size: cover !important;
        background-position: ${Math.round(focusX * 100)}% ${Math.round(focusY * 100)}% !important;
      }
    `
  }

  /**
   * 结构化 CSS 生成方式
   */
  generateStructuredCSS(theme) {
    const { styles, image, art = {} } = theme
    const focusX = art.focusX ?? 0.5
    const focusY = art.focusY ?? 0.35

    const lines = []

    // CSS 变量定义
    lines.push(`:root {`)
    if (image) {
      lines.push(`  --dream-skin-art: url("${image}");`)
    }
    if (styles.global?.font?.family) {
      lines.push(`  --dream-skin-font-family: '${styles.global.font.family}';`)
    }
    if (styles.global?.font?.size) {
      lines.push(`  --dream-skin-font-size: ${styles.global.font.size}px;`)
    }
    if (styles.global?.font?.color) {
      lines.push(`  --dream-skin-font-color: ${styles.global.font.color};`)
    }
    lines.push(`}`)

    // ── 主题背景（颜色 / 透明度 / 渐变 / 玻璃蒙板） ──
    // 背景「底色」（纯色 / 渐变 / 背景图）由 injectChrome() 注入到固定的全屏背景层
    // （与背景图同源，始终位于所有内容之后），面板在「玻璃蒙板」模式下对该层做半透明 + 模糊。
    // 因此这里只负责「玻璃蒙板」下的面板半透明 + 模糊处理；纯色 / 渐变底色见 injectChrome。
    // 玻璃与渐变相互独立：渐变控制底色层，玻璃控制面板处理，两者可同时开启。
    const bg = styles.global?.background
    if (bg && bg.glass) {
      const hasColor = !!bg.color
      // 无底色（渐变未启用且无背景色）时，玻璃蒙板以主题面板色着色，仍保持半透明 + 模糊
      const bgColor = hasColor ? bg.color : 'var(--ds-panel)'
      const bgOpacity = hasColor ? this.colorAlpha(bg.color, bg.opacity ?? 86) : ((bg.opacity ?? 86) / 100)
      const panelBg = `color-mix(in srgb, ${bgColor} ${Math.round(bgOpacity * 100)}%, transparent)`

      // 玻璃蒙板：面板半透明 + 模糊，露出底层固定背景层（纯色 / 渐变 / 背景图）
      lines.push(`/* glass mask */`)
      lines.push(`html.dream-skin-active [data-tree-group="grp-sessions"] {`)
      lines.push(`  background: ${panelBg} !important;`)
      lines.push(`  border-color: var(--ds-line) !important;`)
      lines.push(`  backdrop-filter: blur(12px) saturate(1.05) !important;`)
      lines.push(`}`)
      lines.push(`html.dream-skin-active [data-tree-group="grp-sessions"] nav { background: transparent !important; }`)
      lines.push(`html.dream-skin-active [data-tree-group="grp-sessions"] button:hover { background: color-mix(in srgb, var(--ds-accent) 18%, transparent) !important; }`)
      lines.push(`html.dream-skin-active [data-tree-group="grp-sessions"] [aria-current="page"] { color: var(--ds-text) !important; background: color-mix(in srgb, var(--ds-accent) 24%, transparent) !important; box-shadow: inset 0 0 0 1px var(--ds-line) !important; }`)
      lines.push(`html.dream-skin-active [data-tree-group="grp-main"] {`)
      lines.push(`  background: ${panelBg} !important;`)
      lines.push(`}`)
      lines.push(`html.dream-skin-active [data-role="user"], html.dream-skin-active [data-slot="aui_assistant-message-root"] {`)
      lines.push(`  background: ${panelBg} !important;`)
      lines.push(`  backdrop-filter: blur(4px) !important;`)
      lines.push(`}`)
      lines.push(`html.dream-skin-active [data-slot="composer-surface"] {`)
      lines.push(`  background: ${panelBg} !important;`)
      lines.push(`  border: 1px solid var(--ds-line) !important;`)
      lines.push(`  border-radius: 18px !important;`)
      lines.push(`  box-shadow: 0 12px 34px color-mix(in srgb, var(--ds-accent) 8%, transparent) !important;`)
      lines.push(`  backdrop-filter: blur(14px) saturate(1.06) !important;`)
      lines.push(`}`)
      lines.push(`html.dream-skin-active [data-slot="statusbar"] { background: ${panelBg} !important; }`)
      lines.push(`html.dream-skin-active .dream-home>div:first-child>div:first-child>div:first-child { border: 1px solid var(--ds-line) !important; border-radius: 20px !important; box-shadow: 0 18px 48px color-mix(in srgb, var(--ds-accent) 9%, transparent) !important; }`)
      lines.push(`html.dream-skin-active .dream-home>div:first-child>div:first-child>div:first-child::before { background: radial-gradient(ellipse at center, color-mix(in srgb, var(--ds-panel) 92%, transparent) 0 23%, transparent 72%); }`)
    }

    // 全局字体
    const globalFont = styles.global?.font
    if (globalFont?.family || globalFont?.size || globalFont?.color) {
      const rootDecls = []
      if (globalFont.family) rootDecls.push(`font-family: '${globalFont.family}' !important;`)
      if (globalFont.size) rootDecls.push(`font-size: ${globalFont.size}px !important;`)
      if (globalFont.color) rootDecls.push(`color: ${globalFont.color} !important;`)
      // 根元素：字体家族 / 字号靠继承即可（图标元素的字体 class 会正常覆盖继承值）
      if (rootDecls.length) {
        lines.push(`html.dream-skin-active {`)
        lines.push(`  ${rootDecls.join(' ')}`)
        lines.push(`}`)
      }
      // 仅把「颜色」下放到所有后代：可见文字多在子节点且多有自身 color 声明，
      // 仅改根元素颜色会被继承覆盖、看不到效果；用重复类把特异性抬到 (0,3,1)，
      // 压过默认全局规则对子元素的着色；区域专属规则特异性更高(0,3,2)，仍优先。
      // 注意：字体家族 / 字号【不】下放到 *，否则 !important 的 * 选择器会覆盖图标
      // 字体的 class 声明，导致图标渲染成缺失字形（变成“叉”）。
      if (globalFont.color) {
        lines.push(`html.dream-skin-active.dream-skin-active * {`)
        lines.push(`  color: ${globalFont.color} !important;`)
        lines.push(`}`)
      }
    }

    // 全局边框
    if (styles.global?.border?.color || styles.global?.border?.width !== undefined) {
      const border = styles.global.border
      const borderColor = border.color || '#000000'
      const borderWidth = border.width ?? 0
      lines.push(`html.dream-skin-active {`)
      lines.push(`  border: ${borderWidth}px solid ${borderColor} !important;`)
      if (border.radius !== undefined) {
        lines.push(`  border-radius: ${border.radius}px !important;`)
      }
      lines.push(`}`)
    }

    // 背景图说明：实际背景图由 injectChrome() 以「固定背景层」注入（docs 的
    // Fixed Background Div Technique）。主内容区的背景由上方「主题背景」生成
    // （玻璃蒙板 / 渐变 / 纯色）决定；非上述情况时全局规则已将其中性化为透明。
    // 因此这里不再对主内容区硬编码 background，避免覆盖主题的背景设置。

    // 各区域样式
    for (const [area, config] of Object.entries(styles.areas || {})) {
      if (!config?.enabled) continue

      const selector = AREA_SELECTORS[area]
      if (!selector) continue

      // 区分两类声明：
      //  - fontDecls（字体类：color / size / family）：应「下放到子元素」，因为可见文字多在
      //    后代节点（按钮、[aria-current="page"]、nav 等），且全局规则对子元素有更高特异性的
      //    !important 着色，仅改根元素颜色会被覆盖、看不到效果。
      //  - boxDecls（容器类：background / border / radius）：只作用于区域容器本身，不要糊到每个子节点。
      const fontDecls = []
      const boxDecls = []
      if (config.font?.color) fontDecls.push(`color: ${config.font.color} !important;`)
      if (config.font?.size) fontDecls.push(`font-size: ${config.font.size}px !important;`)
      if (config.font?.family) fontDecls.push(`font-family: '${config.font.family}' !important;`)
      if (config.background?.color) {
        const bg = config.background
        const opacity = this.colorAlpha(bg.color, bg.opacity ?? 80)
        boxDecls.push(`background-color: ${this.hexToRgba(bg.color, opacity)} !important;`)
      }
      if (config.border?.color || config.border?.width !== undefined) {
        const borderColor = config.border.color || '#000000'
        const borderWidth = config.border.width ?? 0
        boxDecls.push(`border: ${borderWidth}px solid ${borderColor} !important;`)
      }
      if (config.border?.radius !== undefined) {
        boxDecls.push(`border-radius: ${config.border.radius}px !important;`)
      }

      lines.push(`/* ${area} */`)
      // 根元素：字体 + 容器样式
      lines.push(`html.dream-skin-active ${selector} {`)
      if (fontDecls.length) lines.push(`  ${fontDecls.join(' ')}`)
      if (boxDecls.length) lines.push(`  ${boxDecls.join(' ')}`)
      lines.push(`}`)

      // 仅「颜色」下放到所有后代元素（字体家族 / 字号靠继承）。
      // 用 html.dream-skin-active.dream-skin-active 重复类把特异性从 (0,2,1) 抬到 (0,3,1)，
      // 正好压过全局对子元素（如 [aria-current="page"]）的 !important 着色；
      // 主题样式表在全局之后注入，同特异性时后者胜出。
      // 不放字体家族：否则 !important 的 * 选择器会覆盖图标字体的 class 声明，
      // 导致该区域图标渲染成缺失字形（变成“叉”）。
      const areaColorDecl = config.font?.color ? `color: ${config.font.color} !important;` : ''
      if (areaColorDecl) {
        lines.push(`html.dream-skin-active.dream-skin-active ${selector} * {`)
        lines.push(`  ${areaColorDecl}`)
        lines.push(`}`)
      }
    }

    // 自定义 CSS（最高优先级）
    if (styles.customCSS?.trim()) {
      lines.push(`/* Custom CSS */`)
      lines.push(styles.customCSS)
    }

    return lines.join('\n')
  }

  /**
   * hex 颜色转 rgba
   * 支持 8 位 hex（#RRGGBBAA）：优先使用内嵌的 alpha 通道，
   * 否则回退到传入的 opacity 参数（兼容仅含 #RRGGBB 的旧配置）。
   */
  hexToRgba(hex, opacity) {
    const clean = (hex || '').replace('#', '')
    if (clean.length >= 8) {
      const r = parseInt(clean.substring(0, 2), 16)
      const g = parseInt(clean.substring(2, 4), 16)
      const b = parseInt(clean.substring(4, 6), 16)
      const a = parseInt(clean.substring(6, 8), 16) / 255
      return `rgba(${r}, ${g}, ${b}, ${a})`
    }
    const r = parseInt(clean.substring(0, 2) || '0', 16)
    const g = parseInt(clean.substring(2, 4) || '0', 16)
    const b = parseInt(clean.substring(4, 6) || '0', 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }

  /**
   * 取背景色透明度（0..1）。
   * 优先用内嵌的 8 位 hex alpha（颜色选择器直接设置的透明度）；
   * 否则回退到 legacy 的 opacity 字段（兼容旧主题 / 预设）。
   */
  colorAlpha(hex, fallbackPct) {
    const clean = (hex || '').replace('#', '')
    if (clean.length >= 8) {
      return parseInt(clean.substring(6, 8), 16) / 255
    }
    return ((fallbackPct ?? 86) / 100)
  }

  /**
   * 将 hex 颜色按比例加深（factor=0.4 表示变暗 40%）
   * 用于「渐变背景」生成深一档的终止色。
   */
  darkenHex(hex, factor = 0.3) {
    const clean = (hex || '').replace('#', '').slice(0, 6)
    const r = parseInt(clean.substring(0, 2) || '0', 16)
    const g = parseInt(clean.substring(2, 4) || '0', 16)
    const b = parseInt(clean.substring(4, 6) || '0', 16)
    const f = 1 - factor
    const nr = Math.round(r * f)
    const ng = Math.round(g * f)
    const nb = Math.round(b * f)
    const toHex = (n) => n.toString(16).padStart(2, '0')
    return `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`
  }

  /**
   * 注入样式标签
   */
  injectStyle(css) {
    // 移除旧的样式标签
    if (this.styleEl) {
      this.styleEl.textContent = css
      return
    }

    // 创建新的样式标签
    this.styleEl = document.createElement('style')
    this.styleEl.id = STYLE_ID
    this.styleEl.textContent = css
    document.head.appendChild(this.styleEl)

    // 添加标记类到 html
    document.documentElement.classList.add('dream-skin-active')
  }

  /**
   * 注入「全局规则」（与主题解耦的共享元素级覆盖）
   *
   * 写入独立的 <style id="hermes-dream-skin-global">，独立于主题切换：
   * 插件启动时调用一次即可长期生效；用户在面板中修改后再次调用本方法即时重注入。
   * 这些规则均以 html.dream-skin-active 为前缀，主题未应用时不会生效。
   */
  applyGlobalCSS(css) {
    if (!css) return
    if (this.globalEl) {
      this.globalEl.textContent = css
      return
    }
    this.globalEl = document.createElement('style')
    this.globalEl.id = GLOBAL_ID
    this.globalEl.textContent = css
    document.head.appendChild(this.globalEl)
  }

  /** 移除全局规则样式标签 */
  removeGlobal() {
    if (this.globalEl) {
      this.globalEl.remove()
      this.globalEl = null
    }
  }

  /**
   * 注入固定背景层（全屏底色 / 背景图 / 渐变）
   *
   * 采用 docs/hermes-desktop-plugin-dev 的「Fixed Background Div Technique」：
   * 作为 body.firstChild 插入，不设 z-index / 不设 opacity:0 —— 否则背景会
   * 被放到页面之后或完全不可见（见文档 pitfalls：z-index:-1 / opacity:0 均为坑）。
   *
   * 渐变与背景图关系：
   *  - 二者可共存（分层叠加）：渐变作为半透明蒙层盖在背景图之上，底层是图、顶层是渐变；
   *    Gradient Opacity 控制渐变自身透明度（调低 → 透出底图），Background Opacity
   *    同时作用于两层（调低 → 整块背景淡入 app 原生外观）。
   *  - 仅渐变（无图）：单层渐变。仅图（无渐变）：单层图。
   *  - 纯色兜底：bg.color 存在且无图、无渐变时渲染纯色底。
   * 这一层是主题「玻璃蒙板」要模糊 / 透出的对象，因此无论主题是否带图都会创建，
   * 确保渐变 / 纯色 / 玻璃效果真正可见（不再依赖被宿主根容器遮盖的 body 背景）。
   */
  injectChrome(theme) {
    if (this.chromeEl) {
      this.chromeEl.remove()
      this.chromeEl = null
    }
    if (this.gradientEl) {
      this.gradientEl.remove()
      this.gradientEl = null
    }

    const bg = theme?.styles?.global?.background
    const layerOp = (bg?.layerOpacity ?? 100) / 100

    // 构建渐变 paint（多色数组按顺序；兼容旧 preset 单色降级为 [color, darker]）
    const gradPaint = (() => {
      if (!bg?.gradient) return null
      const gradColors = (Array.isArray(bg.colors) && bg.colors.length)
        ? bg.colors
        : (bg.color ? [bg.color, this.darkenHex(bg.color, 0.4)] : null)
      if (!gradColors || !gradColors.length) return null
      // 整体渐变透明度：把每个颜色的内嵌 alpha 再乘以 gradientOpacity 系数
      const gOp = (bg.gradientOpacity ?? 100) / 100
      const stops = gradColors.map((c) => {
        const clean = (c || '').replace('#', '')
        if (clean.length >= 8) {
          const base = '#' + clean.slice(0, 6)
          const a = (parseInt(clean.slice(6, 8), 16) / 255) * gOp
          const ah = Math.round(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, '0')
          return `${base}${ah}`
        }
        const ah = Math.round(Math.max(0, Math.min(1, gOp)) * 255).toString(16).padStart(2, '0')
        return `${c}${ah}`
      })
      return `linear-gradient(135deg, ${stops.join(', ')})`
    })()

    // 分层叠加：渐变 + 背景图同时存在 → 图在底、渐变蒙层在上（二者均 position:fixed，
    // 渐变层 DOM 顺序靠后 → 绘制在图片之上）。Gradient Opacity 控制渐变自身透明度、
    // 透出底图；Background Opacity 同时作用于两层、整体淡入/淡出 app。
    if (gradPaint && theme?.image) {
      const art = theme.art || {}
      const fx = Math.round((art.focusX ?? 0.5) * 100)
      const fy = Math.round((art.focusY ?? 0.35) * 100)
      // 底层：背景图
      this.chromeEl = document.createElement('div')
      this.chromeEl.id = CHROME_ID
      this.chromeEl.setAttribute('aria-hidden', 'true')
      this.chromeEl.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        background-image: url("${theme.image}");
        background-size: cover;
        background-position: ${fx}% ${fy}%;
        background-repeat: no-repeat;
        opacity: ${layerOp};
      `
      document.body.insertBefore(this.chromeEl, document.body.firstChild)
      // 顶层：渐变蒙层（半透明，盖在图上）
      this.gradientEl = document.createElement('div')
      this.gradientEl.id = CHROME_GRAD_ID
      this.gradientEl.setAttribute('aria-hidden', 'true')
      this.gradientEl.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        background: ${gradPaint};
        opacity: ${layerOp};
      `
      this.chromeEl.after(this.gradientEl)
      return
    }

    // 仅渐变（无图）：单层渐变
    if (gradPaint) {
      this._mountChromeLayer(gradPaint, layerOp)
      return
    }

    // 仅背景图（无渐变）
    if (theme?.image) {
      const art = theme.art || {}
      const fx = Math.round((art.focusX ?? 0.5) * 100)
      const fy = Math.round((art.focusY ?? 0.35) * 100)
      this.chromeEl = document.createElement('div')
      this.chromeEl.id = CHROME_ID
      this.chromeEl.setAttribute('aria-hidden', 'true')
      this.chromeEl.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        background-image: url("${theme.image}");
        background-size: cover;
        background-position: ${fx}% ${fy}%;
        background-repeat: no-repeat;
        opacity: ${layerOp};
      `
      document.body.insertBefore(this.chromeEl, document.body.firstChild)
      return
    }

    // 纯色底色
    const paint = (bg && bg.color) ? this.hexToRgba(bg.color, (bg.opacity ?? 86) / 100) : null
    if (!paint) return
    this._mountChromeLayer(paint)
  }

  /** 挂载固定全屏底色层（渐变 / 纯色通用），layerOpacity 控制整层透明度 */
  _mountChromeLayer(paint, layerOpacity = 1) {
    this.chromeEl = document.createElement('div')
    this.chromeEl.id = CHROME_ID
    this.chromeEl.setAttribute('aria-hidden', 'true')
    this.chromeEl.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      background: ${paint};
      opacity: ${layerOpacity};
    `
    // 插入到 body 第一个子节点之前 → 自然位于所有内容之后（无需 z-index）
    document.body.insertBefore(this.chromeEl, document.body.firstChild)
  }

  /**
   * 移除主题
   */
  removeTheme() {
    if (this.styleEl) {
      this.styleEl.remove()
      this.styleEl = null
    }

    if (this.chromeEl) {
      this.chromeEl.remove()
      this.chromeEl = null
    }

    if (this.gradientEl) {
      this.gradientEl.remove()
      this.gradientEl = null
    }

    document.documentElement.classList.remove('dream-skin-active')
    this.currentTheme = null
  }

  /**
   * 清理所有注入的样式
   */
  dispose() {
    this.removeTheme()
    this.removeGlobal()
  }
}

// --- ui/panel.js ---
/**
 * UI 面板组件
 *
 * 提供主题管理界面：
 * - 主题列表（选中态以边框颜色区分）
 * - 添加主题（内联页面，含名称、背景图、样式编辑）
 * - 删除主题
 * - 样式编辑器（字体、颜色、背景、边框等可视化配置）
 */


const { Button, Input, ScrollArea } = window.__HERMES_PLUGIN_SDK__

// 统一按钮样式：固定底色 #9fb6e4 + 白字 + 12px（所有按钮一致）
// 注意：宿主 Tailwind 构建会剥离颜色工具类（如 bg-blue-600 / bg-[#...]），
// 因此底色必须用内联 style 设置，className 只负责形状/间距。
const BTN = 'rounded-lg px-3 py-1.5 font-medium whitespace-nowrap hover:opacity-90 transition-opacity'
const BTN_STYLE = { backgroundColor: '#9fb6e4', color: '#ffffff', fontSize: 12 }

function createPanel({ themeManager, cssInjector }) {
  return React.createElement(DreamSkinPanel, { themeManager, cssInjector })
}

function DreamSkinPanel({ themeManager, cssInjector }) {
  const [themes, setThemes] = React.useState(() => themeManager.getAllThemes())
  const [activeTheme, setActiveTheme] = React.useState(() => themeManager.getActiveTheme())
  const [view, setView] = React.useState('list') // 'list' | 'add' | 'edit'
  const [editingTheme, setEditingTheme] = React.useState(null)

  // 新增主题状态
  const [newThemeName, setNewThemeName] = React.useState('')
  const [selectedFile, setSelectedFile] = React.useState(null)
  const [newStyles, setNewStyles] = React.useState(null)
  // 编辑视图中待保存的新背景图
  const [editFile, setEditFile] = React.useState(null)
  // 保存 StyleEditor 当前草稿，供顶部"Keep"按钮读取
  const draftRef = React.useRef(null)

  // 全局规则弹框状态
  const [showGlobalDialog, setShowGlobalDialog] = React.useState(false)
  const [globalDraft, setGlobalDraft] = React.useState('')

  // 主题目录（路径选择器）：默认指向插件安装目录下的 themes/
  const [themesDir, setThemesDir] = React.useState('')
  React.useEffect(() => {
    themeManager.getThemesDir().then(setThemesDir).catch(() => {})
  }, [themeManager])

  // 是否尚未设置有效的主题目录（渲染进程无法自动获取 userData，需用户在面板选择）
  const dirMissing = !themesDir || themesDir.includes('<user>')

  // 刷新主题列表
  const refreshThemes = React.useCallback(() => {
    setThemes(themeManager.getAllThemes())
    setActiveTheme(themeManager.getActiveTheme())
  }, [themeManager])

  // 监听主题变化
  React.useEffect(() => {
    themeManager.onThemeChange((theme) => {
      setActiveTheme(theme)
    })
  }, [themeManager])

  // 切换主题
  const handleSwitchTheme = (themeId) => {
    try {
      themeManager.setActiveTheme(themeId)
      const theme = themeManager.getActiveTheme()
      cssInjector.applyTheme(theme)
      // 确保全局规则（native 覆盖）随主题一并注入，Restore Defaults 后也能恢复完整外观
      cssInjector.applyGlobalCSS(themeManager.getGlobalRules())
    } catch (e) {
      console.error('[Dream Skin] Failed to switch theme:', e)
    }
  }

  // 开始添加主题
  const handleStartAdd = () => {
    setNewThemeName('')
    setSelectedFile(null)
    setNewStyles(null)
    setView('add')
  }

  // 保存新增主题（统一入口：始终落盘 themes/<名称>/theme.json）
  const handleSaveNewTheme = async (styles) => {
    const name = newThemeName.trim()
    if (!name) {
      alert('Please enter a theme name')
      return
    }
    try {
      const finalStyles = styles || draftRef.current || null
      const theme = await themeManager.createTheme({
        name,
        imageFile: selectedFile || null,
        styles: finalStyles
      })

      // 自动切换到新主题
      themeManager.setActiveTheme(theme.id)
      cssInjector.applyTheme(theme)
      cssInjector.applyGlobalCSS(themeManager.getGlobalRules())

      // 重置并返回列表
      setNewThemeName('')
      setSelectedFile(null)
      setNewStyles(null)
      setView('list')
      refreshThemes()
    } catch (e) {
      console.error('[Dream Skin] Failed to add theme:', e)
      alert(`Failed to add theme: ${e.message}`)
    }
  }

  // 开始编辑主题
  const handleStartEdit = (theme) => {
    setEditingTheme(theme)
    setEditFile(null)
    setView('edit')
  }

  // 保存编辑的主题
  const handleSaveEdit = async (styles) => {
    if (!editingTheme) return

    await themeManager.updateThemeStyles(editingTheme.id, styles)

    // 若更换了背景图，一并保存
    if (editFile) {
      try {
        await themeManager.updateThemeImage(editingTheme.id, editFile)
      } catch (e) {
        console.error('[Dream Skin] Failed to update theme image:', e)
      }
    }

    // 如果是当前激活的主题，重新应用
    const active = themeManager.getActiveTheme()
    if (active?.id === editingTheme.id) {
      cssInjector.applyTheme(active)
      cssInjector.applyGlobalCSS(themeManager.getGlobalRules())
    }

    setEditingTheme(null)
    setEditFile(null)
    setView('list')
    refreshThemes()
  }

  // 选择主题目录（宿主原生文件夹选择器）
  const handlePickThemesDir = async () => {
    try {
      const hd = window.hermesDesktop
      if (!hd || typeof hd.selectPaths !== 'function') {
        alert('Current host does not support folder selection')
        return
      }
      // hermesDesktop.selectPaths 真实签名：
      //   selectPaths(options?: { title?, defaultPath?, directories?: boolean, multiple?, filters? }) => Promise<string[]>
      // 选目录必须传 directories: true；返回 string[]（绝对路径数组）。
      const res = await hd.selectPaths({ title: '选择主题目录', directories: true })
      const picked = Array.isArray(res) ? res[0] : (typeof res === 'string' ? res : null)
      if (!picked) return
      themeManager.setThemesDir(picked)
      setThemesDir(picked)
      await handleRescan()
    } catch (e) {
      console.error('[Dream Skin] pick themes dir failed', e)
      alert(`Failed to select folder: ${e.message}`)
    }
  }

  // 合并「重新扫描 + Reload」：以主题目录为单一数据源，重扫磁盘 + 重载 Storage + 重新应用当前主题。
  // 改路径、新增主题、或外部手动放入主题文件夹后，点此即可生效；选中文件夹后也会自动调用。
  const handleRescan = async () => {
    try {
      // 从管理器读取真实生效目录（避免依赖可能过期的前端 state 闭包）
      const dir = await themeManager.getThemesDir()
      if (!dir) {
        alert('Please click "Select Folder" in the Themes Folder card above, pointing to the themes/ folder under the plugin install directory')
        return
      }
      themeManager.setThemesDir(dir)
      setThemesDir(dir)
      await themeManager.reloadFromStorage()
      const active = themeManager.getActiveTheme()
      if (active) cssInjector.applyTheme(active)
      refreshThemes()
    } catch (e) {
      console.error('[Dream Skin] rescan/reload failed', e)
      alert(`重新加载失败: ${e.message}`)
    }
  }

  // 恢复 app 原生状态：停用 Dream Skin，移除所有注入样式，回到 app 原生外观
  const handleRestoreDefaults = async () => {
    if (!confirm('Disable Dream Skin and restore the app to its native appearance? This turns off all themes.')) {
      return
    }
    try {
      await themeManager.restoreSystemDefaults()
      // 立即移除已注入的主题样式与全局规则，恢复原生外观（不再套用任何主题）
      cssInjector.removeTheme()
      cssInjector.removeGlobal()
      setView('list')
      refreshThemes()
    } catch (e) {
      console.error('[Dream Skin] Failed to restore defaults:', e)
    }
  }

  // 删除主题
  const handleRemoveTheme = (themeId) => {
    if (!confirm('Are you sure you want to delete this theme?')) {
      return
    }

    themeManager.removeTheme(themeId)
    refreshThemes()
  }

  // 打开「全局规则」弹框：载入当前全局规则到草稿
  const handleOpenGlobal = () => {
    setGlobalDraft(themeManager.getGlobalRules())
    setShowGlobalDialog(true)
  }

  // 保存全局规则：持久化并即时重注入
  const handleSaveGlobal = () => {
    try {
      themeManager.setGlobalRules(globalDraft)
      cssInjector.applyGlobalCSS(globalDraft)
      setShowGlobalDialog(false)
    } catch (e) {
      console.error('[Dream Skin] Failed to save global rules:', e)
    }
  }

  // 全局规则重置为默认
  const handleResetGlobal = () => {
    setGlobalDraft(DEFAULT_GLOBAL_CSS)
  }

  return React.createElement('div', { className: 'p-4 space-y-4' },
    // 标题 + 操作按钮（同一行：标题在左，按钮在右）
    view === 'list' && React.createElement('div', { className: 'flex items-center justify-between mb-3' },
      React.createElement('h2', { className: 'text-lg font-semibold' }, 'Dream Skin'),
      React.createElement('div', { className: 'flex items-center gap-2' },
        React.createElement(Button, {
          onClick: handleStartAdd,
          className: BTN,
          style: BTN_STYLE
        }, 'Add Theme'),
        React.createElement(Button, {
          onClick: handleRescan,
          className: BTN,
          style: BTN_STYLE,
          title: 'Rescan themes folder and reload (merged Reload)'
        }, 'Rescan'),
        React.createElement(Button, {
          onClick: handleRestoreDefaults,
          className: BTN,
          style: BTN_STYLE,
          title: 'Disable Dream Skin and restore the app to its native appearance'
        }, 'Restore Defaults'),
        React.createElement(Button, {
          onClick: handleOpenGlobal,
          className: BTN,
          style: BTN_STYLE,
          title: 'View and edit global rules applied on plugin startup (shared across all themes)'
        }, 'Global Rules')
      )
    ),

    // 全局规则弹框（模态）：查看 / 修改
    showGlobalDialog && React.createElement('div', {
      style: {
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,.55)', padding: 16
      },
      onClick: (e) => { if (e.target === e.currentTarget) setShowGlobalDialog(false) }
    },
      React.createElement('div', {
        style: {
          width: 'min(720px, 94vw)', maxHeight: '86vh',
          display: 'flex', flexDirection: 'column',
          background: 'var(--ds-panel, #191c22)', color: 'var(--ds-text, #edf0f1)',
          border: '1px solid var(--ds-line, rgba(130,152,163,.24))',
          borderRadius: 14, boxShadow: '0 24px 64px rgba(0,0,0,.5)', overflow: 'hidden'
        }
      },
        // 标题栏
        React.createElement('div', {
          style: {
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 18px', borderBottom: '1px solid var(--ds-line, rgba(130,152,163,.24))'
          }
        },
          React.createElement('h3', { style: { fontSize: 16, fontWeight: 600 } }, 'Global Rules'),
          React.createElement('button', {
            onClick: () => setShowGlobalDialog(false),
            title: 'Close',
            style: {
              width: 30, height: 30, borderRadius: 8, border: '1px solid transparent',
              background: 'transparent', color: 'var(--ds-muted, #a3aaae)',
              cursor: 'pointer', fontSize: 18, lineHeight: 1
            }
          }, '×')
        ),
        // 说明 + 编辑区
        React.createElement('div', { style: { padding: '16px 18px', flex: 1, overflow: 'auto' } },
          React.createElement('p', {
            style: { fontSize: 12, color: 'var(--ds-muted, #a3aaae)', marginBottom: 10, lineHeight: 1.5 }
          }, 'These rules are applied on plugin startup and require a theme to be active. They are shared across all themes and are not stored per-theme.'),
          React.createElement('textarea', {
            value: globalDraft,
            onChange: (e) => setGlobalDraft(e.target.value),
            spellCheck: false,
            style: {
              width: '100%', height: '46vh', resize: 'none',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 12, lineHeight: 1.55, color: '#9ae6b4', background: '#0c0f14',
              border: '1px solid var(--ds-line, rgba(130,152,163,.24))',
              borderRadius: 8, padding: 12
            }
          })
        ),
        // 底部按钮
        React.createElement('div', {
          style: {
            display: 'flex', gap: 8, justifyContent: 'flex-end',
            padding: '12px 18px', borderTop: '1px solid var(--ds-line, rgba(130,152,163,.24))'
          }
        },
          React.createElement(Button, {
            onClick: handleResetGlobal, className: BTN, style: BTN_STYLE,
            title: 'Reset global rules to default'
          }, 'Reset'),
          React.createElement(Button, {
            onClick: () => setShowGlobalDialog(false), className: BTN, style: BTN_STYLE
          }, 'Cancel'),
          React.createElement(Button, {
            onClick: handleSaveGlobal, className: BTN, style: BTN_STYLE
          }, 'Save')
        )
      )
    ),

    // 列表视图
    view === 'list' && React.createElement(React.Fragment, null,

      // 主题目录设置（运行时扫描，可改路径）
      React.createElement('div', {
        className: 'p-3 mb-3 rounded-lg border border-(--ui-stroke-secondary) space-y-2'
      },
        React.createElement('label', { className: 'block text-xs font-medium text-(--ui-text-secondary)' }, 'Themes Folder'),
        React.createElement('div', { className: 'flex items-center gap-2' },
          React.createElement(Input, {
            value: themesDir || '',
            onChange: (e) => setThemesDir(e.target.value),
            placeholder: 'C:/Users/<user>/AppData/Local/hermes/desktop-plugins/hermes-dream-skin/themes'
          }),
          React.createElement(Button, {
            onClick: handlePickThemesDir,
            className: BTN,
            style: BTN_STYLE
          }, 'Select Folder')
        )
      ),

      // 主题列表
      React.createElement(ScrollArea, { className: 'h-[calc(100vh-280px)]' },
        React.createElement('div', { className: 'space-y-2' },
          themes.length === 0
            ? React.createElement('div', { className: 'text-sm text-(--ui-text-tertiary) text-center py-8 space-y-1' },
                dirMissing
                  ? React.createElement(React.Fragment, null,
                      React.createElement('p', null, '尚未设置主题目录。'),
                      React.createElement('p', null, '请先在上方「主题路径」选择 themes 文件夹，再点「重新扫描」。')
                    )
                  : React.createElement('p', null, 'No themes yet. Click "Add Theme" to get started.')
              )
            : themes.map(theme =>
                React.createElement(ThemeCard, {
                  key: theme.id,
                  theme,
                  isActive: activeTheme?.id === theme.id,
                  onActivate: () => handleSwitchTheme(theme.id),
                  onRemove: () => handleRemoveTheme(theme.id),
                  onEdit: () => handleStartEdit(theme)
                })
              )
        )
      )
    ),

    // 添加主题视图
    view === 'add' && React.createElement(React.Fragment, null,
      // 顶部标题和按钮
      React.createElement('div', { className: 'flex items-center justify-between' },
        React.createElement('h2', { className: 'text-lg font-semibold' }, 'Add New Theme'),
        React.createElement('div', { className: 'flex items-center gap-2' },
          React.createElement('button', {
            onClick: () => handleSaveNewTheme(draftRef.current),
            className: 'px-3 py-1.5 rounded hover:opacity-90 text-sm',
            style: { backgroundColor: '#9fb6e4', color: '#ffffff', fontSize: 12 }
          }, 'Keep'),
          React.createElement('button', {
            onClick: () => { setNewThemeName(''); setSelectedFile(null); setView('list') },
            className: 'px-3 py-1.5 rounded hover:opacity-90 text-sm',
            style: { backgroundColor: '#9fb6e4', color: '#ffffff', fontSize: 12 }
          }, 'Cancel')
        )
      ),

      // 主题名称
      React.createElement('div', null,
        React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Theme Name'),
        React.createElement(Input, {
          value: newThemeName,
          onChange: (e) => setNewThemeName(e.target.value),
          placeholder: 'e.g., Gothic Void'
        })
      ),

      // 背景图片（可拖入 + 点击选择）
      React.createElement(BackgroundImageField, {
        label: 'Background Image',
        onFile: setSelectedFile
      }),

      // 样式编辑器
      React.createElement(StyleEditor, {
        onSave: handleSaveNewTheme,
        onCancel: () => setView('list'),
        draftRef,
        isNew: true
      })
    ),

    // 编辑主题视图
    view === 'edit' && editingTheme && React.createElement(React.Fragment, null,
      // 顶部标题和按钮
      React.createElement('div', { className: 'flex items-center justify-between' },
        React.createElement('h2', { className: 'text-lg font-semibold' }, 'Edit Theme'),
        React.createElement('div', { className: 'flex items-center gap-2' },
          React.createElement('button', {
            onClick: () => handleSaveEdit(draftRef.current),
            className: 'px-3 py-1.5 rounded hover:opacity-90 text-sm',
            style: { backgroundColor: '#9fb6e4', color: '#ffffff', fontSize: 12 }
          }, 'Keep'),
          React.createElement('button', {
            onClick: () => { setView('list'); setEditingTheme(null); setEditFile(null) },
            className: 'px-3 py-1.5 rounded hover:opacity-90 text-sm',
            style: { backgroundColor: '#9fb6e4', color: '#ffffff', fontSize: 12 }
          }, 'Cancel')
        )
      ),

      // 主题名称（只读）
      React.createElement('div', null,
        React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Theme Name'),
        React.createElement(Input, {
          value: editingTheme.name,
          disabled: true
        })
      ),

      // 背景图片（可拖入 + 点击选择，initialPreview 展示当前图）
      React.createElement(BackgroundImageField, {
        label: 'Background Image',
        initialPreview: editingTheme.image,
        onFile: setEditFile
      }),

      // 样式编辑器
      React.createElement(StyleEditor, {
        theme: editingTheme,
        onSave: handleSaveEdit,
        onCancel: () => { setView('list'); setEditingTheme(null); setEditFile(null) },
        draftRef,
        isNew: false
      })
    )
  )
}

/**
 * 背景图片选择区（可拖入 + 点击选择）
 *
 * 设计要点：整块区域本身就是一个 <label>，文件输入以 sr-only 形式内联，
 * 点击区域由浏览器原生打开文件对话框——不再依赖「隐藏的 <input> + 代码里调 .click()」
 * 那种看不见的按钮逻辑。拖拽放下同样走原生 drag 事件。
 */
const SR_ONLY = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
  border: 0
}

function BackgroundImageField({ label, initialPreview, onFile }) {
  const [preview, setPreview] = React.useState(initialPreview || null)
  const [isDrag, setIsDrag] = React.useState(false)
  const idRef = React.useRef('bg-input-' + Math.random().toString(36).slice(2))
  const inputId = idRef.current

  const handleFiles = React.useCallback((files) => {
    const file = files && files[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    onFile(file)
  }, [onFile])

  return React.createElement('div', { className: 'space-y-2' },
    React.createElement('label', { className: 'block text-sm font-medium' }, label),
    React.createElement('label', {
      htmlFor: inputId,
      className: `flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer text-center transition-colors ${isDrag ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`,
      onDragOver: (e) => { e.preventDefault(); setIsDrag(true) },
      onDragLeave: (e) => { e.preventDefault(); setIsDrag(false) },
      onDrop: (e) => { e.preventDefault(); setIsDrag(false); handleFiles(e.dataTransfer.files) }
    },
      preview
        ? React.createElement('img', {
            src: preview,
            alt: 'Background preview',
            className: 'w-full h-32 object-cover rounded-lg pointer-events-none'
          })
        : React.createElement(React.Fragment, null,
            React.createElement('div', { className: 'text-3xl text-gray-400' }, '⬆'),
            React.createElement('div', { className: 'text-sm text-gray-600' }, 'Drag an image here, or click to select'),
            React.createElement('div', { className: 'text-xs text-gray-400' }, 'Recommended 2560×1440 or higher')
          ),
      React.createElement('input', {
        id: inputId,
        type: 'file',
        accept: 'image/*',
        style: SR_ONLY,
        onChange: (e) => handleFiles(e.target.files)
      })
    )
  )
}

/**
 * 主题卡片组件
 * 选中态以边框颜色区分；列表上的按钮统一蓝色背景；「Activate」按钮点击后才正式应用主题。
 */
function ThemeCard({ theme, isActive, onActivate, onRemove, onEdit }) {
  // 列表按钮统一蓝色背景（宿主主题变量 --ui-accent）
  const blueBtn = 'px-2 py-0.5 rounded text-xs transition-colors'
  const blueStyle = {
    background: 'var(--ui-accent)',
    border: '1px solid var(--ui-accent)',
    color: '#fff'
  }
  const blueStyleDisabled = { ...blueStyle, opacity: 0.5, cursor: 'not-allowed' }

  return React.createElement('div', {
    className: `relative p-3 rounded-lg border-2 transition-all ${
      isActive ? 'border-(--ui-accent)' : 'border-(--ui-stroke-secondary) hover:border-(--ui-text-tertiary)'
    }`,
    title: isActive ? 'Active theme' : 'Use "Activate" to apply this theme'
  },
    // 顶部：主题名 + 操作按钮（蓝色背景）
    React.createElement('div', { className: 'flex items-center justify-between mb-2' },
      React.createElement('h3', { className: 'font-medium text-sm' }, theme.name),
      React.createElement('div', { className: 'flex gap-1' },
        // 激活按钮（图标，点击才正式应用主题）
        React.createElement('button', {
          disabled: isActive,
          onClick: (e) => { e.stopPropagation(); if (!isActive) onActivate() },
          style: isActive ? blueStyleDisabled : blueStyle,
          className: blueBtn,
          title: isActive ? 'This theme is active' : 'Activate this theme'
        }, isActive ? '✓' : '✓'),
        // 编辑按钮
        React.createElement('button', {
          disabled: isActive,
          onClick: (e) => { e.stopPropagation(); if (!isActive) onEdit() },
          style: isActive ? blueStyleDisabled : blueStyle,
          className: blueBtn,
          title: isActive ? 'Active theme cannot be edited' : 'Edit Styles'
        }, '✎'),
        // 删除按钮
        React.createElement('button', {
          disabled: isActive,
          onClick: (e) => { e.stopPropagation(); if (!isActive) onRemove() },
          style: isActive ? blueStyleDisabled : blueStyle,
          className: blueBtn,
          title: isActive ? 'Active theme cannot be deleted' : 'Delete Theme'
        }, '×')
      )
    ),
    // 底部：预览图
    theme.image && React.createElement('img', {
      src: theme.image,
      alt: theme.name,
      className: 'w-full h-20 object-cover rounded-md'
    })
  )
}

// --- index.js ---
/**
 * Hermes Dream Skin - 核心插件逻辑
 *
 * 负责：
 * 1. 初始化主题管理器
 * 2. 注册路由和侧边栏导航项
 * 3. 注入 CSS
 * 4. 监听主题变化
 */


class DreamSkinPlugin {
  constructor(ctx) {
    this.ctx = ctx
    this.themeManager = new ThemeManager(ctx)
    this.cssInjector = new CSSInjector()
    this.disposers = []
  }

  async init() {
    // 1. 初始化 CSS 注入器
    this.cssInjector.init()

    // 2. 加载持久化的主题配置（并运行时扫描 themes/ 目录）
    await this.themeManager.loadFromStorage()

    // 3. 注入全局规则（与主题解耦的共享元素级覆盖）：插件启动即生效，
    //    仅在主题激活（html.dream-skin-active）时显示。后续主题切换不影响它。
    this.cssInjector.applyGlobalCSS(this.themeManager.getGlobalRules())

    // 4. 如果有激活的主题，立即应用
    const activeTheme = this.themeManager.getActiveTheme()
    if (activeTheme) {
      this.cssInjector.applyTheme(activeTheme)
    }

    // 4. 注册路由和侧边栏导航
    this.registerPanel()

    // 5. 监听主题变化事件
    this.themeManager.onThemeChange((theme) => {
      this.cssInjector.applyTheme(theme)
    })

    console.log('[Hermes Dream Skin] Plugin initialized')
  }

  registerPanel() {
    // 注册路由
    const routeDispose = this.ctx.register({
      id: 'dream-skin-route',
      area: 'routes',
      data: {
        path: '/dream-skin'
      },
      render: () => createPanel({
        themeManager: this.themeManager,
        cssInjector: this.cssInjector
      })
    })

    // 注册侧边栏导航项
    const navDispose = this.ctx.register({
      id: 'dream-skin-nav',
      area: 'sidebar.nav',
      data: {
        codicon: 'symbol-color',
        label: 'Dream Skin',
        path: '/dream-skin'
      }
    })

    this.disposers.push(routeDispose, navDispose)
  }

  dispose() {
    this.disposers.forEach(dispose => dispose())
    this.cssInjector.dispose()
  }
}

// --- Plugin Entry ---
export default {
  id: 'hermes-dream-skin',
  name: 'Hermes Dream Skin',
  defaultEnabled: true,
  register(ctx) {
    const plugin = new DreamSkinPlugin(ctx)
    plugin.init()
  }
}
