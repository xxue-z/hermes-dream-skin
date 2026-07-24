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
const GLOBAL_ID = 'hermes-dream-skin-global'
const CHROME_ID = 'hermes-dream-skin-chrome'
const CHROME_GRAD_ID = 'hermes-dream-skin-chrome-grad'

export class CSSInjector {
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

      // 磨砂质感（Frost Blur）：单一滑条控制整体模糊强度，保持原有视觉层级
      // —— 输入框最强、侧栏次之、消息气泡最弱（避免重模糊压文字可读性）。
      const frost = bg.frost ?? 14
      const sidebarBlur = Math.max(0, Math.round(frost * 0.85))
      const msgBlur = Math.max(0, Math.round(frost * 0.3))
      const composerBlur = Math.max(0, frost)

      // 玻璃蒙板：面板半透明 + 模糊，露出底层固定背景层（纯色 / 渐变 / 背景图）
      lines.push(`/* glass mask */`)
      lines.push(`html.dream-skin-active [data-tree-group="grp-sessions"] {`)
      lines.push(`  background: ${panelBg} !important;`)
      lines.push(`  border-color: var(--ds-line) !important;`)
      lines.push(`  backdrop-filter: blur(${sidebarBlur}px) saturate(1.05) !important;`)
      lines.push(`}`)
      lines.push(`html.dream-skin-active [data-tree-group="grp-sessions"] nav { background: transparent !important; }`)
      lines.push(`html.dream-skin-active [data-tree-group="grp-sessions"] button:hover { background: color-mix(in srgb, var(--ds-accent) 18%, transparent) !important; }`)
      lines.push(`html.dream-skin-active [data-tree-group="grp-sessions"] [aria-current="page"] { color: var(--ds-text) !important; background: color-mix(in srgb, var(--ds-accent) 24%, transparent) !important; box-shadow: inset 0 0 0 1px var(--ds-line) !important; }`)
      lines.push(`html.dream-skin-active [data-tree-group="grp-main"] {`)
      lines.push(`  background: ${panelBg} !important;`)
      lines.push(`}`)
      lines.push(`html.dream-skin-active [data-role="user"], html.dream-skin-active [data-slot="aui_assistant-message-root"] {`)
      lines.push(`  background: ${panelBg} !important;`)
      lines.push(`  backdrop-filter: blur(${msgBlur}px) !important;`)
      lines.push(`}`)
      lines.push(`html.dream-skin-active [data-slot="composer-surface"] {`)
      lines.push(`  background: ${panelBg} !important;`)
      lines.push(`  border: 1px solid var(--ds-line) !important;`)
      lines.push(`  border-radius: 18px !important;`)
      lines.push(`  box-shadow: 0 12px 34px color-mix(in srgb, var(--ds-accent) 8%, transparent) !important;`)
      lines.push(`  backdrop-filter: blur(${composerBlur}px) saturate(1.06) !important;`)
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
