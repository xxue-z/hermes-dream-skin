/**
 * Hermes Dream Skin - 核心插件逻辑
 *
 * 负责：
 * 1. 初始化主题管理器
 * 2. 注册路由和侧边栏导航项
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

  async init() {
    // 1. 初始化 CSS 注入器
    this.cssInjector.init()

    // 2. 加载持久化的主题配置（并运行时扫描 themes/ 目录）
    await this.themeManager.loadFromStorage()

    // 3. 从文件加载全局规则（默认文件 + 用户修改文件分离落盘），随后注入。
    //    文件为读取源，必须在 applyGlobalCSS 之前 await 完成。
    await this.themeManager.loadGlobalRules()

    // 4. 注入全局规则（与主题解耦的共享元素级覆盖）：插件启动即生效，
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
