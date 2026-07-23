/**
 * CSS 注入器
 *
 * 负责：
 * - 创建和管理动态 CSS 样式标签
 * - 根据主题配置生成 CSS
 * - 注入到 DOM 中
 * - 支持主题切换时的清理和重新注入
 */

import { AREA_SELECTORS } from './style-config.js'

const STYLE_ID = 'hermes-dream-skin-style'
const CHROME_ID = 'hermes-dream-skin-chrome'

export class CSSInjector {
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
