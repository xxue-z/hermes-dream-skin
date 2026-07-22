# Hermes Dream Skin

给 Hermes Desktop 添加 Codex Dream Skin 风格的背景图+氛围感主题系统。

## 功能特性

- **背景图注入**：为聊天界面、侧边栏等注入自定义背景图
- **氛围感主题**：基于背景图自动提取主色调，生成协调的主题色
- **明暗模式适配**：支持 light/dark 模式切换，背景图自动适配
- **主题管理器**：内置主题管理 UI，支持添加/删除/切换主题
- **安全无侵入**：通过官方插件系统实现，不改 Hermes 源码

## 快速安装

### 方式一：直接复制（推荐）

1. **关闭 Hermes Desktop**

2. **复制插件文件夹**到桌面插件目录：
   ```
   %LOCALAPPDATA%\hermes\desktop-plugins\hermes-dream-skin\
   ```

3. **启动 Hermes Desktop**

4. **启用插件**：
   - 打开 Settings（设置）
   - 切换到 Plugins（插件）标签
   - 找到 "Hermes Dream Skin"
   - 点击 Enable（启用）

### 方式二：从源码构建

```bash
git clone <repo-url> hermes-dream-skin
cd hermes-dream-skin
npm install
npm run build

# 复制到插件目录
cp -r hermes-dream-skin "%LOCALAPPDATA%\hermes\desktop-plugins\"
```

## 使用指南

### 添加新主题

1. 在 Hermes Desktop 侧边栏找到 **Dream Skin** 图标
2. 点击 **"Add Theme"** 按钮
3. 输入主题名称
4. 选择背景图片（推荐 2560x1440 或更高分辨率）
5. 点击 **Save** 保存

### 切换主题

1. 打开 Dream Skin 面板
2. 点击想要应用的主题卡片
3. 主题立即生效

### 导入预设主题

将预设主题文件夹复制到 `themes/` 目录，重启 Hermes Desktop 即可。

## 主题配置格式

```json
{
  "schemaVersion": 1,
  "id": "my-theme",
  "name": "My Theme",
  "description": "A beautiful custom theme",
  "image": "background.jpg",
  "appearance": "auto",
  "art": {
    "focusX": 0.5,
    "focusY": 0.35,
    "safeArea": "center",
    "taskMode": "ambient"
  },
  "palette": {
    "accent": "#8b0000",
    "accentInk": "#ffcccc"
  }
}
```

更多配置说明见 `themes/README.md`。

## 目录结构

```
hermes-dream-skin/
├── plugin.js              # 插件入口（已打包）
├── package.json           # 插件元数据
├── README.md             # 本文件
├── INSTALL.md            # 详细安装指南
├── build.mjs             # 构建脚本
├── themes/               # 主题存储目录
│   ├── README.md        # 主题格式规范
│   ├── preset-gothic-void-crusade/
│   │   └── theme.json
│   └── preset-arina-hashimoto/
│       └── theme.json
├── src/                  # 源码
│   ├── index.js          # 插件主逻辑
│   ├── theme-manager.js  # 主题管理器
│   ├── css-injector.js   # CSS 注入器
│   └── ui/
│       └── panel.js      # UI 面板
└── assets/               # 插件资源
```

## 技术原理

本插件通过 Hermes Desktop 的官方插件系统（`HermesPlugin` API）实现：

1. **注册插件**：通过 `HermesPlugin` 接口注册到 Hermes
2. **注入 CSS**：动态创建 `<style>` 标签注入自定义 CSS
3. **主题管理**：使用 `PluginStorage` 持久化主题配置
4. **UI 集成**：通过 `Contribute` API 在侧边栏添加主题面板

## 与 Codex Dream Skin 的对比

| 特性 | Codex Dream Skin | Hermes Dream Skin |
|------|------------------|-------------------|
| 技术路径 | CDP 远程注入 | 官方插件系统 |
| 侵入性 | 无源码侵入 | 无源码侵入 |
| 持久性 | 每次启动需重新注入 | 随应用启动自动加载 |
| UI 集成度 | 外部托盘 | 内置侧边栏面板 |
| 主题格式 | theme.json + CSS | theme.json + 动态 CSS |

## Hermes Desktop DOM 结构参考

> 以下选择器基于 Hermes Desktop 实际 DOM 结构确定，用于 CSS 注入时精准定位各 UI 区域。

| 区域 | data-slot / class / 属性 | 对应颜色 |
|------|------------------------|---------|
| 聊天内容区域 | `[data-tree-group="grp-main"]` |  红色 |
| 用户消息气泡 | `[data-role="user"]` |  紫色 |
| 聊天输入框 | `[data-slot="composer-surface"]` |  橙色 |
| 左侧边栏 | `[data-tree-group="grp-sessions"]` | 🔵 蓝色 |
| 侧边栏分组 | `[data-slot="sidebar-group"]` |  青色 |
| 顶部工具栏 | `div[class*="h-[34px]"]` | 🟢 绿色 |
| 底部状态栏 | `[data-slot="statusbar"]` | 🟡 黄色 |

**注**：实际 DOM 类名可能随 Hermes Desktop 版本变化，建议通过 DevTools 实时检查确认。

## 开发

```bash
# 安装依赖
npm install

# 开发模式（热重载）
npm run dev

# 构建
npm run build
```

## 许可

MIT License
