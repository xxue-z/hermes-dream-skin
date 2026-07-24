/**
 * 样式配置模块
 *
 * 定义区域选择器映射、默认样式结构和 UI 元数据
 */

/** 区域到 DOM 选择器的映射（选择器均来自 docs/hermes-desktop-plugin-dev 的已验证清单） */
export const AREA_SELECTORS = {
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
export const DEFAULT_PALETTE_CSS = `:root{
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
export const DEFAULT_GLOBAL_CSS = `html.dream-skin-active{color:var(--ds-text)!important;}
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

export const DEFAULT_STYLES = {
  global: {
    font: {
      family: '"Segoe UI Variable Text", "Segoe UI", "Microsoft YaHei UI", system-ui, sans-serif',
      size: 14,
      color: '#edf0f1'
    },
    background: { gradient: false, glass: true, colors: ['#191c22db'], gradientOpacity: 100, layerOpacity: 100, frost: 14 },
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
export const STYLE_METADATA = {
  font: {
    family: { label: 'Font Family', type: 'text', default: 'system-ui' },
    size: { label: 'Font Size', type: 'range', min: 10, max: 24, unit: 'px', default: 14 },
    color: { label: 'Font Color', type: 'color', default: '#ffffff', hasOpacity: true }
  },
  background: {
    color: { label: 'Background Color', type: 'color', default: '#191c22db', hasOpacity: true },
    gradient: { label: 'Enable Gradient', type: 'checkbox', default: false },
    glass: { label: 'Glass Mask', type: 'checkbox', default: true },
    frost: { label: 'Frost Blur', type: 'range', min: 0, max: 40, unit: 'px', default: 14 }
  },
  border: {
    color: { label: 'Border Color', type: 'color', default: '#333333', hasOpacity: true },
    width: { label: 'Border Width', type: 'range', min: 0, max: 10, unit: 'px', default: 1 },
    radius: { label: 'Border Radius', type: 'range', min: 0, max: 24, unit: 'px', default: 8 }
  }
}
