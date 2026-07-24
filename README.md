# Hermes Dream Skin

给 Hermes Desktop 添加 Codex Dream Skin 风格的背景图 + 氛围感主题系统。通过官方插件系统实现，**不修改 Hermes 源码**，随应用启动自动加载。

## 功能特性

- **背景图注入**：以「固定背景层」注入聊天 / 侧边栏等区域（主内容区保持透明，露出背景），支持 JPG / PNG / WebP。
- **氛围感主题**：基于 Codex Dream Skin 移植的 `--ds-*` 暗色调色板，可精确控制背景色、文字色、强调色、渐变遮罩、玻璃蒙板等。
- **侧边栏面板**：内置 `Dream Skin` 侧边栏入口（`/dream-skin` 路由），支持主题增删改、切换、重新扫描。
- **Style Editor**：可视化调字体 / 颜色 / 背景 / 边框；颜色选择器支持 HEX + Alpha（`#RRGGBBAA`），背景图支持拖入与点击选择。
- **全局规则（Global Rules）**：与主题解耦的共享元素级覆盖（透明化宿主默认不透明背景 / 模糊 / 边框），可在面板实时查看并修改、即时重注入。
- **预设主题**：内置 3 套预设（Ultraman / Arina Hashimoto / Gothic Void Crusade），随 `themes/` 目录加载。
- **外观模式**：主题可声明 `auto` / `light` / `dark`（调色板以暗色氛围为主）。
- **安全无侵入**：通过官方 `HermesPlugin` API 与 `PluginStorage` 持久化，无需改 Hermes 本体。

## 快速安装

### 方式一：直接复制（推荐）

1. **关闭 Hermes Desktop**。
2. **复制插件文件夹**到桌面插件目录：
   ```
   %LOCALAPPDATA%\hermes\desktop-plugins\hermes-dream-skin\
   ```
   若 `desktop-plugins` 目录不存在，请手动创建。

   > ⚠️ **必须包含 `themes/` 目录**：插件运行时通过宿主 IPC 扫描该目录加载预设主题，
   > 部署时务必把项目里的 `themes/`（含 `preset-ultraman`、`preset-arina-hashimoto`、
   > `preset-gothic-void-crusade` 三个预设文件夹与各自的 `theme.json` / 背景图）一并复制。
   > 结构应形如：
   > ```
   > %LOCALAPPDATA%\hermes\desktop-plugins\hermes-dream-skin\
   > ├── plugin.js
   > └── themes\
   >     ├── preset-ultraman\theme.json (+ background.jpg)
   >     ├── preset-arina-hashimoto\theme.json (+ background.jpg)
   >     └── preset-gothic-void-crusade\theme.json (+ background.jpg)
   > ```

3. **启动 Hermes Desktop**。
4. **启用插件**：Settings → Plugins → 找到 "Hermes Dream Skin" → 点击 Enable。

### 方式二：从源码构建

```bash
git clone <repo-url> hermes-dream-skin
cd hermes-dream-skin
npm install
npm run build          # 由 src/ 拼接生成 plugin.js

# 复制到插件目录（含 themes/）
cp -r hermes-dream-skin "%LOCALAPPDATA%\hermes\desktop-plugins\"
```

> 修改源码后需重新 `npm run build`，再到 Hermes 执行 **Reload desktop plugins**（⌘K）生效。

## 使用指南

### 首次使用：设置主题目录（扫描预设）

> 插件运行在 Electron 渲染进程隔离环境，**无法可靠自动获取** `%LOCALAPPDATA%` 用户路径，
> 因此首次打开面板时列表可能为空，需手动指认一次主题目录，路径会写入插件 Storage 持久化。

1. 打开 Dream Skin 面板，顶部「主题路径 (Themes Folder)」卡片若提示「未设置主题目录」，
   点击 **选择文件夹**，指向插件安装目录下的 `themes/`：
   ```
   C:/Users/<你的用户名>/AppData/Local/hermes/desktop-plugins/hermes-dream-skin/themes
   ```
2. 选中后插件**自动重新扫描**，预设主题（preset-*）随即出现并可直接激活。
3. 该路径已写入 Storage，下次打开面板**自动加载**，无需重复选择。

> 改路径 / 新增主题 / 外部手动放入主题文件夹后，点同一卡片的 **重新扫描** 即可
> （重扫磁盘 + 重载 Storage + 重新应用当前激活主题）。

### 添加新主题

主题会真实写入主题目录 `themes/<名称>/theme.json`，可在文件管理器看到该文件夹。

1. 在 Dream Skin 面板顶部点击 **"Add Theme"** 按钮。
2. 在「Add New Theme」页填写：
   - **Theme Name**（必填）：即磁盘文件夹名。
   - **Background Image**（可选）：拖入或点击选择 JPG / PNG / WebP；不填则暂用默认暗色背景。
   - 可展开 **Style Editor** 调整字体 / 颜色 / 背景 / 边框等。
3. 点击右上角 **Keep（保持）** 创建主题（自动落盘并激活）；**Cancel（取消）** 放弃草稿。

> 背景图也可创建后再加：进入编辑视图换图，或直接往 `themes/<名称>/` 文件夹丢图片，插件会自动探测应用。

### Style Editor

- **颜色选择器**：原生取色 + Alpha 滑块，输出 `#RRGGBBAA`，无 CDN 依赖。
- **背景图字段**：支持拖入与点击选择（`<label for>` 原生关联），编辑视图也能换图。
- 调好的样式结构化为 `styles.global` / `styles.areas`，并生成 `customCSS` 调色板回写 `theme.json`。

### 切换主题

1. 打开 Dream Skin 面板。
2. 在主题卡片上点击 **✓** 按钮应用该主题（当前激活主题显示高亮边框）。
3. 主题立即生效。

### 删除主题

1. 找到要删除的主题（激活中的需先切换到其他主题）。
2. 点击卡片上的 **×** 按钮并确认。

> 删除仅从列表移除；其磁盘文件夹 `themes/<名称>/` 仍保留。需彻底删除请手动删文件夹，
> 下次「重新扫描」时该主题不再出现。

### 全局规则（Global Rules）

面板顶部 **Global Rules** 图标可打开弹框，查看与编辑插件启动时注入的共享元素级覆盖
（透明化宿主默认背景 / 模糊 / 边框，让主题样式正常接管）。修改后的规则即时重注入，
并分离落盘（`global/global-default.css` 为出厂默认，用户修改另存），与单个主题解耦。

### 导入主题（手动放入文件夹）

两种方式的主题最终都存放在 `themes/<名称>/theme.json`，效果相同：

- **面板创建**：点 **Add Theme**，插件自动建好文件夹与 `theme.json`。
- **手动放置**：把含 `theme.json`（和可选背景图）的文件夹复制到
  `%LOCALAPPDATA%\hermes\desktop-plugins\hermes-dream-skin\themes\`。

手动放入后**无需重启**，在面板点 **重新扫描** 即可让新主题出现。

## 主题配置格式

每个主题是一个独立文件夹，内含 `theme.json`：

```
%LOCALAPPDATA%\hermes\desktop-plugins\hermes-dream-skin\themes\
└── <主题名称>\
    ├── theme.json      ← 主题配置（必填）
    └── background.jpg   ← 背景图（可选，也可内嵌进 theme.json）
```

> 用面板 **Add Theme** / **Edit** 创建或编辑主题时，`theme.json` 由插件自动生成并**回写磁盘**；
> 也可直接编辑文件，保存后在面板点「重新扫描」生效。

### theme.json 结构

```json
{
  "schemaVersion": 1,
  "id": "theme-1700000000000",
  "name": "My Theme",
  "description": "",
  "appearance": "auto",
  "art": {
    "focusX": 0.5,
    "focusY": 0.35,
    "safeArea": "center",
    "taskMode": "ambient"
  },
  "image": "background.jpg",
  "styles": {
    "global": {
      "font": { "family": "...", "size": 14, "color": "#edf0f1" },
      "background": { "gradient": false, "glass": true, "colors": ["#191c22db"], "frost": 14 },
      "border": { "color": "#8298a3", "width": 0, "radius": 0 }
    },
    "areas": {
      "topBar":      { "enabled": false, "font": {}, "background": {}, "border": {} },
      "leftSidebar": { "enabled": false, "font": {}, "background": {}, "border": {} },
      "chatArea":    { "enabled": false, "font": {}, "background": {}, "border": {} },
      "bottomBar":   { "enabled": false, "font": {}, "background": {}, "border": {} }
    },
    "customCSS": ":root{ --ds-bg:#111318; --ds-text:#edf0f1; /* ...调色板... */ }"
  }
}
```

### 字段说明

| 字段 | 说明 |
|------|------|
| `appearance` | 外观模式：`auto` / `light` / `dark` |
| `art.focusX` / `art.focusY` | 背景图焦点坐标 (0–1) |
| `art.safeArea` | 安全区域：`left` / `right` / `center` / `none` |
| `art.taskMode` | 任务模式：`ambient` / `banner` / `off` |
| `image` | 背景图。可写 `data:` base64（面板创建默认），或写文件夹内文件名（如 `background.jpg`）；也可省略，插件自动探测文件夹内图片 |
| `styles.global` | 全局字体 / 背景 / 边框（在 Style Editor 中可视化调整） |
| `styles.areas` | 分区覆盖：`topBar` / `leftSidebar` / `chatArea` / `bottomBar`，各自可单独设 font / background / border |
| `styles.customCSS` | `:root{...}` 调色板，定义 `--ds-*` 变量（背景色、文字色、强调色、渐变遮罩等）；无 `styles` 的旧主题走 legacy 路径（仅背景图 + 半透明遮罩） |

> 更完整的字段与示例见 [`INSTALL.md`](./INSTALL.md) 与 [`themes/README.md`](./themes/README.md)。

## 目录结构

```
hermes-dream-skin/
├── plugin.js              # 插件入口（由 build.mjs 拼接 src/ 生成）
├── package.json           # 插件元数据
├── README.md              # 本文件
├── INSTALL.md             # 详细安装与使用指南
├── build.mjs              # 构建脚本（拼接 src/*.js → plugin.js）
├── sync-presets.mjs       # 重新同步三套预设的调色板到插件运行时
├── themes/                # 主题存储目录
│   ├── README.md          # 主题格式规范
│   ├── preset-ultraman\            # 预设：青/绿暗色（Codex 默认主题）
│   │   ├── theme.json
│   │   └── background.jpg
│   ├── preset-arina-hashimoto\     # 预设：暗色玫瑰
│   │   ├── theme.json
│   │   └── background.jpg
│   └── preset-gothic-void-crusade\ # 预设：金/米哥特
│       ├── theme.json
│       └── background.jpg
├── src/                   # 源码
│   ├── index.js           # 插件主逻辑（注册路由 / 侧边栏 / 监听主题变化）
│   ├── style-config.js    # 区域选择器映射、默认调色板与全局规则、UI 元数据
│   ├── style-editor.js    # Style Editor（含 ColorPicker、BackgroundImageField）
│   ├── theme-manager.js   # 主题管理（Storage 持久化 + 磁盘 IPC 扫描）
│   ├── css-injector.js    # CSS 注入器（背景层 + 主题 + 全局规则）
│   ├── presets.js         # AUTO-GENERATED：预设种子（由 sync-presets.mjs 生成）
│   └── ui/
│       └── panel.js       # 侧边栏 UI 面板
├── global/
│   └── global-default.css # 出厂默认全局规则（用户修改分离落盘）
└── assets/                # 插件资源
```

## 技术原理

本插件通过 Hermes Desktop 的官方插件系统（`HermesPlugin` API）实现：

1. **注册插件**：以 `defaultEnabled: true` 的插件对象注册到 Hermes。
2. **注入 CSS**：
   - **背景层**：`CSSInjector` 以 `body.firstChild` 固定背景层注入背景图（无 `z-index` / 无 `opacity:0`），主区保持透明露出背景。
   - **主题样式**：有 `styles` 字段走 `generateStructuredCSS`（结构化生成，`customCSS` 作为最后一块注入，优先级最高）；旧主题走 `generateLegacyCSS`（仅背景图 + 半透明遮罩）。
   - **全局规则**：启动即注入独立 `<style id="hermes-dream-skin-global">`，透明化宿主默认不透明背景 / 模糊 / 边框。
3. **主题管理**：`ThemeManager` 用 `PluginStorage` 持久化配置，并通过宿主 IPC 扫描 `themes/` 目录发现预设与用户主题。
4. **UI 集成**：`index.js` 注册 `/dream-skin` 路由与侧边栏导航项，渲染 React 面板。

## Hermes Desktop DOM 结构参考

> 以下选择器基于 Hermes Desktop 实际 DOM 结构确定（来自 `docs/hermes-desktop-plugin-dev` 已验证清单），用于 CSS 注入时精准定位各 UI 区域。根标记为 `html.dream-skin-active`。

| 区域 | 选择器 | 用途 |
|------|--------|------|
| 根作用域 | `html.dream-skin-active` | 主题生效开关 |
| 聊天内容区域 | `[data-tree-group="grp-main"]` | 主区透明化 |
| 用户消息气泡 | `[data-role="user"]` | 透明化 |
| 助手消息 | `[data-slot="aui_assistant-message-root"]` | 透明化 |
| 消息视口 | `[data-slot="aui_thread-viewport"]` | 透明化 |
| 聊天输入框 | `[data-slot="composer-surface"]` | 透明化 |
| 左侧边栏 | `[data-tree-group="grp-sessions"]` | 透明化 |
| 顶部工具栏 | `div[class*="h-[34px]"]` | 顶栏 |
| 底部状态栏 | `[data-slot="statusbar"]` | 底栏 |

**注**：实际 DOM 类名可能随 Hermes Desktop 版本变化，建议通过 DevTools 实时检查确认。

## 与 Codex Dream Skin 的对比

| 特性 | Codex Dream Skin | Hermes Dream Skin |
|------|------------------|-------------------|
| 技术路径 | CDP 远程注入 | 官方插件系统 |
| 侵入性 | 无源码侵入 | 无源码侵入 |
| 持久性 | 每次启动需重新注入 | 随应用启动自动加载 |
| UI 集成度 | 外部托盘 | 内置侧边栏面板 |
| 主题格式 | theme.json + CSS | theme.json + 结构化 `styles` / 动态 CSS |
| 全局规则 | 随主题 | 与主题解耦、可独立编辑 |

## 开发

```bash
# 安装依赖
npm install

# 构建插件（拼接 src/ → plugin.js）
npm run build

# 开发模式（监听改动自动重建）
npm run dev

# 重新同步三套预设的调色板（修改 style-config.js 的调色板后运行）
node sync-presets.mjs
```

> 构建产物 `plugin.js` 会被 `node --check` 校验语法；改完源码后需重新构建，
> 再到 Hermes 执行 **Reload desktop plugins** 生效。

## 许可

MIT License
