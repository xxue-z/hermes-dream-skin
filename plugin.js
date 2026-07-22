/**
 * Hermes Dream Skin Plugin
 * Generated at: 2026-07-22T06:30:02.434Z
 */

// --- style-config.js ---
/**
 * 样式配置模块
 *
 * 定义区域选择器映射、默认样式结构和 UI 元数据
 */

/** 区域到 DOM 选择器的映射 */
const AREA_SELECTORS = {
  topBar: '[data-slot="statusbar"], div[class*="h-[34px]"]',
  leftSidebar: '[data-tree-group="grp-sessions"]',
  chatArea: '[data-slot="composer-bounds"]',
  bottomBar: '[data-slot="statusbar"]'
}

/** 默认样式结构 */
const DEFAULT_STYLES = {
  global: {
    font: { family: 'system-ui', size: 14, color: '#ffffff' },
    background: { color: '#000000', opacity: 80 },
    border: { color: '#333333', width: 1, radius: 8 }
  },
  areas: {
    topBar: { enabled: false, font: {}, background: {}, border: {} },
    leftSidebar: { enabled: false, font: {}, background: {}, border: {} },
    chatArea: { enabled: false, font: {}, background: {}, border: {} },
    bottomBar: { enabled: false, font: {}, background: {}, border: {} }
  },
  customCSS: ''
}

/** 样式属性的 UI 元数据 */
const STYLE_METADATA = {
  font: {
    family: { label: 'Font Family', type: 'text', default: 'system-ui' },
    size: { label: 'Font Size', type: 'range', min: 10, max: 24, unit: 'px', default: 14 },
    color: { label: 'Font Color', type: 'color', default: '#ffffff' }
  },
  background: {
    color: { label: 'Background Color', type: 'color', default: '#000000' },
    opacity: { label: 'Opacity', type: 'range', min: 0, max: 100, unit: '%', default: 80 }
  },
  border: {
    color: { label: 'Border Color', type: 'color', default: '#333333' },
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
  { id: 'global', label: '全局' },
  { id: 'topBar', label: '顶部栏' },
  { id: 'leftSidebar', label: '左侧栏' },
  { id: 'chatArea', label: '聊天区' },
  { id: 'bottomBar', label: '底部栏' }
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
  lines.push('/* Global Background */')
  if (global?.background?.color) {
    const opacity = ((global.background.opacity ?? 80) / 100).toFixed(2)
    lines.push(`body { background-color: ${global.background.color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}; }`)
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
 */
function StyleEditor({ theme, onSave, onCancel }) {
  const [activeTab, setActiveTab] = React.useState('global')
  const [draftStyles, setDraftStyles] = React.useState(() =>
    JSON.parse(JSON.stringify(theme?.styles || DEFAULT_STYLES))
  )

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
      React.createElement(CSSPreview, { css: previewCSS }),

      // 操作按钮
      React.createElement('div', { className: 'flex gap-2 pt-2 border-t' },
        React.createElement('button', {
          onClick: () => onSave(draftStyles),
          className: 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium'
        }, '保存'),
        React.createElement('button', {
          onClick: onCancel,
          className: 'px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm'
        }, '取消')
      )
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
        '启用该区域自定义样式'
      )
    ),

    // 字体属性组
    React.createElement(PropertyGroup, {
      title: '字体',
      category: 'font',
      config: config.font || {},
      metadata: STYLE_METADATA.font,
      onChange: handlePropertyChange,
      disabled: isArea && !config.enabled
    }),

    // 背景属性组
    React.createElement(PropertyGroup, {
      title: '背景',
      category: 'background',
      config: config.background || {},
      metadata: STYLE_METADATA.background,
      onChange: handlePropertyChange,
      disabled: isArea && !config.enabled
    }),

    // 边框属性组
    React.createElement(PropertyGroup, {
      title: '边框',
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
    React.createElement('h4', { className: 'font-medium text-sm text-gray-700 border-b pb-1' }, title),
    React.createElement('div', { className: 'space-y-3' },
      Object.entries(metadata).map(([key, meta]) => {
        const value = config[key] !== undefined ? config[key] : meta.default
        return React.createElement('div', { key, className: 'flex items-center gap-3' },
          React.createElement('label', { className: 'w-24 text-xs text-gray-500 flex-shrink-0' }, meta.label),
          meta.type === 'color' && React.createElement('div', { className: 'flex items-center gap-2 flex-1' },
            React.createElement('input', {
              type: 'color',
              value,
              onChange: (e) => onChange(category, key, e.target.value),
              className: 'w-8 h-8 rounded border cursor-pointer'
            }),
            React.createElement('span', { className: 'text-xs text-gray-400 font-mono' }, value)
          ),
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
 * CSS 预览组件
 */
function CSSPreview({ css }) {
  return React.createElement('div', { className: 'space-y-2' },
    React.createElement('h4', { className: 'font-medium text-sm text-gray-700' }, 'CSS 预览'),
    React.createElement('textarea', {
      readOnly: true,
      value: css,
      className: 'w-full h-40 p-3 text-xs font-mono bg-gray-900 text-green-400 rounded resize-none',
      style: { fontFamily: 'monospace', fontSize: '11px' }
    })
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

class ThemeManager {
  constructor(ctx) {
    this.ctx = ctx
    this.themes = new Map()
    this.activeThemeId = null
    this.listeners = new Set()
  }

  /** 从 PluginStorage 加载主题配置 */
  loadFromStorage() {
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
      }
    } catch (e) {
      console.warn('[Dream Skin] Failed to load themes from storage:', e)
    }

    try {
      this.activeThemeId = this.ctx.storage.get(ACTIVE_THEME_KEY, null)
    } catch (e) {
      console.warn('[Dream Skin] Failed to load active theme:', e)
    }
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

  /** 创建新主题（从图片文件） */
  async createThemeFromImage(imageFile, config = {}) {
    const id = `theme-${Date.now()}`
    const name = config.name || 'Untitled Theme'

    // 将图片转为 base64 data URL
    const imageDataUrl = await this.fileToDataUrl(imageFile)

    const theme = {
      id,
      name,
      image: imageDataUrl,
      appearance: config.appearance || 'auto',
      art: {
        focusX: config.focusX ?? 0.5,
        focusY: config.focusY ?? 0.35,
        safeArea: config.safeArea || 'center',
        taskMode: config.taskMode || 'ambient'
      },
      styles: JSON.parse(JSON.stringify(DEFAULT_STYLES)),
      createdAt: Date.now()
    }

    this.addTheme(theme)
    return theme
  }

  /** 更新主题的样式配置 */
  updateThemeStyles(themeId, styles) {
    const theme = this.themes.get(themeId)
    if (!theme) throw new Error(`Theme not found: ${themeId}`)

    theme.styles = styles
    this.saveToStorage()

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
const CHROME_ID = 'hermes-dream-skin-chrome'

class CSSInjector {
  constructor() {
    this.currentTheme = null
    this.styleEl = null
    this.chromeEl = null
  }

  init() {
    // 初始化时检查是否有已注入的样式
    this.styleEl = document.getElementById(STYLE_ID)
    this.chromeEl = document.getElementById(CHROME_ID)
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

      /* 主内容区背景 */
      html.dream-skin-active main.main-surface,
      html.dream-skin-active [role="main"] {
        background-image: var(--dream-skin-art) !important;
        background-size: cover !important;
        background-position: ${Math.round(focusX * 100)}% ${Math.round(focusY * 100)}% !important;
        background-repeat: no-repeat !important;
        background-attachment: fixed !important;
      }

      /* 侧边栏半透明背景 */
      html.dream-skin-active aside.app-shell-left-panel {
        background: color-mix(in srgb, var(--ui-bg-sidebar) 85%, transparent) !important;
        backdrop-filter: blur(12px) saturate(1.05) !important;
      }

      /* 聊天区域半透明遮罩，确保文字可读性 */
      html.dream-skin-active .thread-scroll-container,
      html.dream-skin-active [data-testid="chat-container"] {
        background: color-mix(in srgb, var(--ui-bg-editor) 92%, transparent) !important;
      }

      /* 消息气泡增强可读性 */
      html.dream-skin-active [data-message-author-role="user"] .message-content,
      html.dream-skin-active [data-message-author-role="assistant"] .message-content {
        background: color-mix(in srgb, var(--ui-bg-bubble) 95%, transparent) !important;
        backdrop-filter: blur(4px) !important;
      }

      /* Composer 区域半透明 */
      html.dream-skin-active .composer-surface-chrome {
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

    // 全局背景
    if (styles.global?.background?.color) {
      const bg = styles.global.background
      const opacity = (bg.opacity ?? 80) / 100
      lines.push(`html.dream-skin-active body {`)
      lines.push(`  background-color: ${this.hexToRgba(bg.color, opacity)} !important;`)
      lines.push(`}`)
    }

    // 全局字体
    if (styles.global?.font?.family || styles.global?.font?.size || styles.global?.font?.color) {
      lines.push(`html.dream-skin-active {`)
      if (styles.global.font.family) {
        lines.push(`  font-family: '${styles.global.font.family}' !important;`)
      }
      if (styles.global.font.size) {
        lines.push(`  font-size: ${styles.global.font.size}px !important;`)
      }
      if (styles.global.font.color) {
        lines.push(`  color: ${styles.global.font.color} !important;`)
      }
      lines.push(`}`)
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

    // 背景图（主内容区）
    lines.push(`/* 主内容区背景 */`)
    lines.push(`html.dream-skin-active main.main-surface,`)
    lines.push(`html.dream-skin-active [role="main"] {`)
    if (image) {
      lines.push(`  background-image: var(--dream-skin-art) !important;`)
      lines.push(`  background-size: cover !important;`)
      lines.push(`  background-position: ${Math.round(focusX * 100)}% ${Math.round(focusY * 100)}% !important;`)
      lines.push(`  background-repeat: no-repeat !important;`)
      lines.push(`  background-attachment: fixed !important;`)
    }
    lines.push(`}`)

    // 各区域样式
    for (const [area, config] of Object.entries(styles.areas || {})) {
      if (!config?.enabled) continue

      const selector = AREA_SELECTORS[area]
      if (!selector) continue

      lines.push(`/* ${area} */`)
      lines.push(`html.dream-skin-active ${selector} {`)

      // 字体
      if (config.font?.color) {
        lines.push(`  color: ${config.font.color} !important;`)
      }
      if (config.font?.size) {
        lines.push(`  font-size: ${config.font.size}px !important;`)
      }
      if (config.font?.family) {
        lines.push(`  font-family: '${config.font.family}' !important;`)
      }

      // 背景
      if (config.background?.color) {
        const bg = config.background
        const opacity = (bg.opacity ?? 80) / 100
        lines.push(`  background-color: ${this.hexToRgba(bg.color, opacity)} !important;`)
      }

      // 边框
      if (config.border?.color || config.border?.width !== undefined) {
        const borderColor = config.border.color || '#000000'
        const borderWidth = config.border.width ?? 0
        lines.push(`  border: ${borderWidth}px solid ${borderColor} !important;`)
      }
      if (config.border?.radius !== undefined) {
        lines.push(`  border-radius: ${config.border.radius}px !important;`)
      }

      lines.push(`}`)
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
   */
  hexToRgba(hex, opacity) {
    const clean = hex.replace('#', '')
    const r = parseInt(clean.substring(0, 2), 16)
    const g = parseInt(clean.substring(2, 4), 16)
    const b = parseInt(clean.substring(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
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
   * 注入 Chrome 层（用于背景图覆盖和特效）
   */
  injectChrome(theme) {
    if (this.chromeEl) {
      this.chromeEl.remove()
    }

    this.chromeEl = document.createElement('div')
    this.chromeEl.id = CHROME_ID
    this.chromeEl.setAttribute('aria-hidden', 'true')
    this.chromeEl.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: -1;
      opacity: 0;
    `

    document.body.appendChild(this.chromeEl)
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

    document.documentElement.classList.remove('dream-skin-active')
    this.currentTheme = null
  }

  /**
   * 清理所有注入的样式
   */
  dispose() {
    this.removeTheme()
  }
}

// --- ui/panel.js ---
/**
 * UI 面板组件
 *
 * 提供主题管理界面：
 * - 主题列表（选中态以边框颜色区分）
 * - 添加主题
 * - 删除主题
 * - 样式编辑器（字体、颜色、背景、边框等可视化配置）
 */


const { Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle, ScrollArea } = window.__HERMES_PLUGIN_SDK__

function createPanel({ themeManager, cssInjector }) {
  return React.createElement(DreamSkinPanel, { themeManager, cssInjector })
}

function DreamSkinPanel({ themeManager, cssInjector }) {
  const [themes, setThemes] = React.useState(() => themeManager.getAllThemes())
  const [activeTheme, setActiveTheme] = React.useState(() => themeManager.getActiveTheme())
  const [editingTheme, setEditingTheme] = React.useState(null)
  const [showAddDialog, setShowAddDialog] = React.useState(false)
  const [newThemeName, setNewThemeName] = React.useState('')
  const [selectedFile, setSelectedFile] = React.useState(null)

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
    } catch (e) {
      console.error('[Dream Skin] Failed to switch theme:', e)
    }
  }

  // 添加主题
  const handleAddTheme = async () => {
    if (!selectedFile || !newThemeName.trim()) {
      return
    }

    try {
      const theme = await themeManager.createThemeFromImage(selectedFile, {
        name: newThemeName.trim()
      })

      // 自动切换到新主题
      themeManager.setActiveTheme(theme.id)
      cssInjector.applyTheme(theme)

      // 重置表单
      setNewThemeName('')
      setSelectedFile(null)
      setShowAddDialog(false)

      // 刷新列表
      refreshThemes()
    } catch (e) {
      console.error('[Dream Skin] Failed to add theme:', e)
      alert(`Failed to add theme: ${e.message}`)
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

  // 处理文件选择
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  // 打开样式编辑器
  const handleEditTheme = (theme) => {
    setEditingTheme(theme)
  }

  // 保存样式
  const handleSaveStyles = (styles) => {
    if (!editingTheme) return

    themeManager.updateThemeStyles(editingTheme.id, styles)

    // 如果是当前激活的主题，重新应用
    const active = themeManager.getActiveTheme()
    if (active?.id === editingTheme.id) {
      cssInjector.applyTheme(active)
    }

    setEditingTheme(null)
    refreshThemes()
  }

  return React.createElement('div', { className: 'p-4 space-y-4' },
    // 标题
    React.createElement('h2', { className: 'text-lg font-semibold' }, 'Dream Skin'),

    // 添加主题按钮
    React.createElement(Button, {
      onClick: () => setShowAddDialog(true),
      className: 'w-full'
    }, 'Add Theme'),

    // 如果正在编辑，显示样式编辑器；否则显示主题列表
    editingTheme
      ? React.createElement(StyleEditor, {
          key: editingTheme.id,
          theme: editingTheme,
          onSave: handleSaveStyles,
          onCancel: () => setEditingTheme(null)
        })
      : React.createElement(ScrollArea, { className: 'h-[300px]' },
          React.createElement('div', { className: 'space-y-2' },
            themes.length === 0
              ? React.createElement('p', { className: 'text-sm text-gray-500 text-center py-8' },
                  'No themes yet. Click "Add Theme" to get started.'
                )
              : themes.map(theme =>
                  React.createElement(ThemeCard, {
                    key: theme.id,
                    theme,
                    isActive: activeTheme?.id === theme.id,
                    onSwitch: () => handleSwitchTheme(theme.id),
                    onRemove: () => handleRemoveTheme(theme.id),
                    onEdit: () => handleEditTheme(theme)
                  })
                )
          )
        ),

    // 添加主题对话框
    showAddDialog && React.createElement(Dialog, { open: true, onOpenChange: setShowAddDialog },
      React.createElement(DialogContent, null,
        React.createElement(DialogHeader, null,
          React.createElement(DialogTitle, null, 'Add New Theme')
        ),
        React.createElement('div', { className: 'space-y-4 mt-4' },
          // 主题名称
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Theme Name'),
            React.createElement(Input, {
              value: newThemeName,
              onChange: (e) => setNewThemeName(e.target.value),
              placeholder: 'e.g., Gothic Void'
            })
          ),
          // 图片选择
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Background Image'),
            React.createElement('input', {
              type: 'file',
              accept: 'image/*',
              onChange: handleFileSelect,
              className: 'block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
            })
          ),
          // 预览
          selectedFile && React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Preview'),
            React.createElement('img', {
              src: URL.createObjectURL(selectedFile),
              alt: 'Preview',
              className: 'w-full h-32 object-cover rounded-lg'
            })
          ),
          // 按钮
          React.createElement('div', { className: 'flex gap-2' },
            React.createElement(Button, {
              onClick: handleAddTheme,
              disabled: !selectedFile || !newThemeName.trim()
            }, 'Save'),
            React.createElement(Button, {
              variant: 'ghost',
              onClick: () => setShowAddDialog(false)
            }, 'Cancel')
          )
        )
      )
    )
  )
}

/**
 * 主题卡片组件
 * 选中态以边框颜色区分，不显示"Active"文本
 */
function ThemeCard({ theme, isActive, onSwitch, onRemove, onEdit }) {
  return React.createElement('div', {
    className: `relative p-3 rounded-lg border-2 cursor-pointer transition-all ${
      isActive ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50/30' : 'border-gray-200 hover:border-gray-400'
    }`,
    onClick: onSwitch
  },
    // 预览图
    theme.image && React.createElement('img', {
      src: theme.image,
      alt: theme.name,
      className: 'w-full h-20 object-cover rounded-md mb-2'
    }),
    // 主题信息
    React.createElement('div', { className: 'flex items-center justify-between' },
      React.createElement('div', null,
        React.createElement('h3', { className: 'font-medium text-sm' }, theme.name)
      ),
      // 操作按钮
      React.createElement('div', { className: 'flex gap-1' },
        // 编辑按钮
        React.createElement('button', {
          onClick: (e) => { e.stopPropagation(); onEdit() },
          className: 'text-gray-400 hover:text-blue-500 transition-colors px-1',
          title: 'Edit Styles'
        }, '✎'),
        // 删除按钮
        React.createElement('button', {
          onClick: (e) => { e.stopPropagation(); onRemove() },
          className: 'text-gray-400 hover:text-red-500 transition-colors px-1',
          title: 'Delete Theme'
        }, '×')
      )
    )
  )
}

// --- index.js ---
/**
 * Hermes Dream Skin - 核心插件逻辑
 *
 * 负责：
 * 1. 初始化主题管理器
 * 2. 注册 UI 面板到侧边栏
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

  init() {
    // 1. 初始化 CSS 注入器
    this.cssInjector.init()

    // 2. 加载持久化的主题配置
    this.themeManager.loadFromStorage()

    // 3. 如果有激活的主题，立即应用
    const activeTheme = this.themeManager.getActiveTheme()
    if (activeTheme) {
      this.cssInjector.applyTheme(activeTheme)
    }

    // 4. 注册侧边栏面板
    this.registerPanel()

    // 5. 监听主题变化事件
    this.themeManager.onThemeChange((theme) => {
      this.cssInjector.applyTheme(theme)
    })

    console.log('[Hermes Dream Skin] Plugin initialized')
  }

  registerPanel() {
    // 注册一个左侧面板
    const dispose = this.ctx.register({
      id: 'dream-skin-panel',
      area: 'panes',
      title: 'Dream Skin',
      data: {
        placement: 'left',
        dock: { pane: 'sessions', pos: 'bottom' }
      },
      render: () => createPanel({
        themeManager: this.themeManager,
        cssInjector: this.cssInjector
      })
    })

    this.disposers.push(dispose)
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
