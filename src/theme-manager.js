/**
 * 主题管理器
 *
 * 负责：
 * - 主题的 CRUD（增删改查）
 * - 主题配置的持久化（通过 PluginStorage）
 * - 主题切换事件通知
 */

import { DEFAULT_STYLES, DEFAULT_GLOBAL_CSS } from './style-config.js'
import { PRESET_THEMES } from './presets.js'

const STORAGE_KEY = 'dream-skin:themes'
const ACTIVE_THEME_KEY = 'dream-skin:active-theme'
const GLOBAL_RULES_KEY = 'dream-skin:global-rules'

export class ThemeManager {
  constructor(ctx) {
    this.ctx = ctx
    this.themes = new Map()
    this.activeThemeId = null
    this.globalRules = null
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

        // 升级 / 播种预设：preset-* id 始终跟踪「打包种子」里的细化配色（调色板）。
        // 插件运行时只从 PluginStorage 取主题、不读 themes/*.json，
        // 故直接改 themes/*.json 无效；种子已打进 bundle，此处落地到 storage。
        // ⚠️ 关键修正：只同步「调色板」(customCSS) 来自种子，用户在预设上的 per-area /
        // global 自定义（例如 leftSidebar 单独改字体颜色）必须保留——否则一旦插件重载，
        // loadFromStorage 会把整个 styles 用种子覆盖，用户改动瞬间消失。
        //    个人主题（theme-* id）不受影响。
        for (const seed of PRESET_THEMES) {
          const existing = this.themes.get(seed.id)
          if (existing) {
            // 保留用户/宿主侧元数据（名称、图片、art、description）
            const seedAreas = seed.styles?.areas || {}
            const userAreas = existing.styles?.areas || {}
            const mergedAreas = {}
            for (const key of new Set([...Object.keys(seedAreas), ...Object.keys(userAreas)])) {
              mergedAreas[key] = { ...(seedAreas[key] || {}), ...(userAreas[key] || {}) }
            }
            existing.styles = {
              ...existing.styles,
              // 调色板跟随种子（保持最新细化配色）
              customCSS: seed.styles?.customCSS || existing.styles?.customCSS,
              // 全局 / 区域：种子默认值打底，用户自定义覆盖其上
              global: {
                ...(seed.styles?.global || {}),
                ...(existing.styles?.global || {})
              },
              areas: mergedAreas
            }
          } else {
            this.themes.set(seed.id, {
              id: seed.id,
              name: seed.name,
              appearance: seed.appearance || 'auto',
              art: seed.art,
              image: seed.image || null,
              styles: JSON.parse(JSON.stringify(seed.styles)),
              createdAt: Date.now()
            })
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

  /** 重新从 PluginStorage 加载主题（清空内存状态后重载） */
  reloadFromStorage() {
    this.themes = new Map()
    this.activeThemeId = null
    this.loadFromStorage()
  }

  /** 恢复系统默认状态：清空所有主题，仅保留种子预设并设为激活 */
  restoreSystemDefaults() {
    this.themes = new Map()
    for (const seed of PRESET_THEMES) {
      this.themes.set(seed.id, {
        id: seed.id,
        name: seed.name,
        appearance: seed.appearance || 'auto',
        art: seed.art,
        image: seed.image || null,
        styles: JSON.parse(JSON.stringify(seed.styles)),
        createdAt: Date.now()
      })
    }
    this.activeThemeId = this.themes.size ? PRESET_THEMES[0].id : null
    // 全局规则一并重置为默认
    this.globalRules = DEFAULT_GLOBAL_CSS
    try {
      this.ctx.storage.set(GLOBAL_RULES_KEY, DEFAULT_GLOBAL_CSS)
    } catch (e) {
      console.warn('[Dream Skin] Failed to save global rules:', e)
    }
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
