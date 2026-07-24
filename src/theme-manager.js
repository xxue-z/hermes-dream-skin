/**
 * 主题管理器
 *
 * 负责：
 * - 主题的 CRUD（增删改查）
 * - 主题配置的持久化（通过 PluginStorage）
 * - 主题切换事件通知
 */

import { DEFAULT_STYLES, DEFAULT_GLOBAL_CSS } from './style-config.js'

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

export class ThemeManager {
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
