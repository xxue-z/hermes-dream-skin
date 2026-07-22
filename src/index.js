/**
 * Hermes Dream Skin - 核心插件逻辑
 *
 * 负责：
 * 1. 初始化主题管理器
 * 2. 注册 UI 面板到侧边栏
 * 3. 注入 CSS
 * 4. 监听主题变化
 */

import { ThemeManager } from './theme-manager.js'
import { CSSInjector } from './css-injector.js'
import { createPanel } from './ui/panel.js'

export class DreamSkinPlugin {
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
