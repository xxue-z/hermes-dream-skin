/**
 * Hermes Dream Skin Plugin
 * Generated at: 2026-07-23T03:30:00.160Z
 */

import React from 'react'

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
    background: { color: '#000000' },
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
    color: { label: 'Font Color', type: 'color', default: '#ffffff', hasOpacity: true }
  },
  background: {
    color: { label: 'Background Color', type: 'color', default: '#000000', hasOpacity: true }
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
    const color = global.background.color
    // 颜色已内嵌 alpha（#RRGGBBAA）时直接使用；否则叠加 background.opacity
    if (color.length >= 9) {
      lines.push(`body { background-color: ${color}; }`)
    } else {
      const opacity = ((global.background.opacity ?? 80) / 100).toFixed(2)
      lines.push(`body { background-color: ${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}; }`)
    }
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

  // 将最新草稿暴露给外层（供面板顶部"保持"按钮读取并保存）
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
function ColorPicker({ value, meta, onChange }) {
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
      'aria-label': '选择颜色'
    },
      React.createElement('div', { className: 'absolute inset-0', style: cpCheckerboard() }),
      React.createElement('div', {
        className: 'absolute inset-0',
        style: { backgroundColor: parsed.hex, opacity: hasOpacity ? parsed.alpha : 1 }
      })
    ),
    // 颜色值文本
    React.createElement('span', {
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
          'aria-label': '颜色'
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
          React.createElement('span', null, '透明度'),
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
          className: 'px-3 py-1.5 rounded border border-(--ui-accent) bg-(--ui-accent) text-white hover:opacity-90 text-xs',
          onClick: () => setIsOpen(false)
        }, '确定')
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

  /** 更新主题的背景图片 */
  async updateThemeImage(themeId, imageFile) {
    const theme = this.themes.get(themeId)
    if (!theme) throw new Error(`Theme not found: ${themeId}`)

    // 将新图片转为 data URL 并写回主题
    const imageDataUrl = await this.fileToDataUrl(imageFile)
    theme.image = imageDataUrl
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
 * - 添加主题（内联页面，含名称、背景图、样式编辑）
 * - 删除主题
 * - 样式编辑器（字体、颜色、背景、边框等可视化配置）
 */


const { Button, Input, ScrollArea } = window.__HERMES_PLUGIN_SDK__

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
  // 保存 StyleEditor 当前草稿，供顶部"保持"按钮读取
  const draftRef = React.useRef(null)

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

  // 开始添加主题
  const handleStartAdd = () => {
    setNewThemeName('')
    setSelectedFile(null)
    setNewStyles(null)
    setView('add')
  }

  // 保存新增主题
  const handleSaveNewTheme = async (styles) => {
    if (!selectedFile || !newThemeName.trim()) {
      alert('Please enter a theme name and select an image')
      return
    }

    try {
      const theme = await themeManager.createThemeFromImage(selectedFile, {
        name: newThemeName.trim()
      })

      // 如果有自定义样式，保存
      if (styles) {
        themeManager.updateThemeStyles(theme.id, styles)
      }

      // 自动切换到新主题
      themeManager.setActiveTheme(theme.id)
      cssInjector.applyTheme(theme)

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

    themeManager.updateThemeStyles(editingTheme.id, styles)

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
    }

    setEditingTheme(null)
    setEditFile(null)
    setView('list')
    refreshThemes()
  }

  // 删除主题
  const handleRemoveTheme = (themeId) => {
    if (!confirm('Are you sure you want to delete this theme?')) {
      return
    }

    themeManager.removeTheme(themeId)
    refreshThemes()
  }

  return React.createElement('div', { className: 'p-4 space-y-4' },
    // 标题（列表视图显示）
    view === 'list' && React.createElement('h2', { className: 'text-lg font-semibold' }, 'Dream Skin'),

    // 列表视图
    view === 'list' && React.createElement(React.Fragment, null,
      // 添加主题按钮
      React.createElement(Button, {
        onClick: handleStartAdd,
        className: 'w-full'
      }, 'Add Theme'),

      // 主题列表
      React.createElement(ScrollArea, { className: 'h-[calc(100vh-180px)]' },
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
            className: 'px-3 py-1.5 rounded border border-(--ui-accent) bg-(--ui-accent) text-white hover:opacity-90 text-sm'
          }, '保持'),
          React.createElement('button', {
            onClick: () => { setNewThemeName(''); setSelectedFile(null); setView('list') },
            className: 'px-3 py-1.5 rounded border border-(--ui-stroke-secondary) text-(--ui-text-secondary) hover:bg-(--chrome-action-hover) text-sm'
          }, '取消')
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
            className: 'px-3 py-1.5 rounded border border-(--ui-accent) bg-(--ui-accent) text-white hover:opacity-90 text-sm'
          }, '保持'),
          React.createElement('button', {
            onClick: () => { setView('list'); setEditingTheme(null); setEditFile(null) },
            className: 'px-3 py-1.5 rounded border border-(--ui-stroke-secondary) text-(--ui-text-secondary) hover:bg-(--chrome-action-hover) text-sm'
          }, '取消')
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
            alt: '背景预览',
            className: 'w-full h-32 object-cover rounded-lg pointer-events-none'
          })
        : React.createElement(React.Fragment, null,
            React.createElement('div', { className: 'text-3xl text-gray-400' }, '⬆'),
            React.createElement('div', { className: 'text-sm text-gray-600' }, '拖放图片到此处，或点击选择'),
            React.createElement('div', { className: 'text-xs text-gray-400' }, '推荐 2560×1440 或更高')
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
 * 选中态以边框颜色区分，不显示"Active"文本
 */
function ThemeCard({ theme, isActive, onSwitch, onRemove, onEdit }) {
  // 激活主题禁止修改/删除：编辑与删除按钮禁用
  const actionBase = 'px-1.5 py-0.5 rounded border transition-colors'
  const actionEnabled = 'text-(--ui-text-tertiary) border-(--ui-stroke-secondary)'
  const actionDisabled = 'opacity-50 cursor-not-allowed text-(--ui-text-tertiary) border-(--ui-stroke-secondary)'

  return React.createElement('div', {
    className: `relative p-3 rounded-lg border-2 cursor-pointer transition-all ${
      isActive ? 'border-(--ui-accent)' : 'border-(--ui-stroke-secondary) hover:border-(--ui-text-tertiary)'
    }`,
    onClick: onSwitch,
    title: isActive ? '当前激活主题（不可编辑/删除）' : '点击应用此主题'
  },
    // 顶部：主题名 + 文字操作按钮
    React.createElement('div', { className: 'flex items-center justify-between mb-2' },
      React.createElement('h3', { className: 'font-medium text-sm' }, theme.name),
      React.createElement('div', { className: 'flex gap-1' },
        // 编辑按钮
        React.createElement('button', {
          disabled: isActive,
          onClick: (e) => { e.stopPropagation(); if (!isActive) onEdit() },
          className: `${actionBase} ${isActive ? actionDisabled : actionEnabled + ' hover:text-(--ui-accent) hover:border-(--ui-accent)'}`,
          title: isActive ? '激活主题不可编辑' : 'Edit Styles'
        }, '✎'),
        // 删除按钮
        React.createElement('button', {
          disabled: isActive,
          onClick: (e) => { e.stopPropagation(); if (!isActive) onRemove() },
          className: `${actionBase} ${isActive ? actionDisabled : actionEnabled + ' hover:text-(--ui-text-primary) hover:border-(--ui-text-primary)'}`,
          title: isActive ? '激活主题不可删除' : 'Delete Theme'
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
