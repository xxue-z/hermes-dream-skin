# Hermes Dream Skin - 安装和使用指南

## 快速安装

### 方式一：直接复制（推荐）

1. **关闭 Hermes Desktop**

2. **复制插件文件夹**到桌面插件目录：
   ```
   %LOCALAPPDATA%\hermes\desktop-plugins\hermes-dream-skin\
   ```

   如果 `desktop-plugins` 目录不存在，请手动创建。

   > ⚠️ **必须包含 `themes/` 目录**：插件运行时通过宿主 IPC 扫描该目录加载预设主题，
   > 因此部署时务必把项目里的 `themes/`（含 `preset-*` 预设文件夹与各自的 `theme.json` / 背景图）
   > 一并复制到上面的插件安装目录下，结构应形如：
   > ```
   > %LOCALAPPDATA%\hermes\desktop-plugins\hermes-dream-skin\
   > ├── plugin.js
   > └── themes\
   >     ├── preset-arina-hashimoto\theme.json (+ background.jpg)
   >     ├── preset-gothic-void-crusade\theme.json (+ background.jpg)
   >     └── preset-ultraman\theme.json (+ background.jpg)
   > ```

3. **启动 Hermes Desktop**

4. **启用插件**：
   - 打开 Settings（设置）
   - 切换到 Plugins（插件）标签
   - 找到 "Hermes Dream Skin"
   - 点击 Enable（启用）

### 方式二：从源码构建

```bash
# 克隆仓库
git clone <repo-url> hermes-dream-skin
cd hermes-dream-skin

# 构建插件（可选，如果需要修改源码）
npm install
npm run build

# 复制到插件目录
cp -r hermes-dream-skin "%LOCALAPPDATA%\hermes\desktop-plugins\"
```

## 使用指南

### 首次使用：设置主题目录（扫描预设）

> 插件运行在 Electron 渲染进程隔离环境，**无法可靠自动获取** `%LOCALAPPDATA%` 用户路径，
> 因此首次打开面板时列表为空，需手动指认一次主题目录。之后路径会记入插件 Storage，免再次选择。

1. 打开 Dream Skin 面板，顶部「主题路径 (Themes Folder)」卡片会提示「未设置主题目录」。
2. 点击 **选择文件夹**，指向插件安装目录下的 `themes/`：
   ```
   C:/Users/<你的用户名>/AppData/Local/hermes/desktop-plugins/hermes-dream-skin/themes
   ```
3. 选中后插件**自动重新扫描**，预设主题（preset-*）随即出现在列表并可直接激活。
4. 该路径已写入 Storage，下次打开面板会**自动加载**，无需重复选择。

> 想要重新加载（改路径 / 新增主题 / 外部手动放入主题文件夹后），点同一卡片的
> **重新扫描** 即可——它已合并原「Reload」：重扫磁盘 + 重载 Storage + 重新应用当前激活主题。

### 添加新主题（创建到磁盘）

主题会真实写入主题目录 `themes/<名称>/theme.json`，你可在文件管理器看到该文件夹。

1. 在 Dream Skin 面板顶部点击 **"Add Theme"** 按钮
2. 在打开的「Add New Theme」页面填写：
   - **Theme Name**（必填）：即磁盘文件夹名
   - **Background Image**（可选）：拖入或点击选择 JPG / PNG / WebP；不填则暂用默认暗色背景
   - 可展开 **Style Editor** 调整字体 / 颜色 / 背景 / 边框等
3. 点击右上角 **Keep** 创建主题（自动落盘并激活）

> 背景图也可创建后再加：进入编辑视图换图，或直接往 `themes/<名称>/` 文件夹里丢图片，插件会自动探测应用。

### 切换主题

1. 打开 Dream Skin 面板
2. 在主题卡片上点击 **✓** 按钮应用该主题（当前激活的主题显示高亮边框）
3. 主题立即生效

### 删除主题

1. 在 Dream Skin 面板中找到要删除的主题（激活中的主题需先切换到其他主题才能删除）
2. 点击主题卡片上的 **×** 按钮
3. 确认删除

> 删除仅从主题列表中移除该主题。其磁盘文件夹 `themes/<名称>/` 仍保留；如需彻底删除，请手动删除该文件夹（删除后在该目录下的主题下次「重新扫描」时不会再出现）。

### 导入主题（手动放入文件夹）

两种方式的主题最终都存放在 `themes/<名称>/theme.json`，效果相同：

- **方式 A（面板创建）**：点 **Add Theme**，插件自动在 `themes/` 下建好文件夹与 `theme.json`。
- **方式 B（手动放置）**：把含 `theme.json`（和可选背景图）的文件夹复制到：
  ```
  %LOCALAPPDATA%\hermes\desktop-plugins\hermes-dream-skin\themes\
  ```

手动放入后**无需重启**，在面板顶部「主题路径」卡片点 **重新扫描** 即可让新主题出现在列表。

## 主题配置

主题以文件夹形式存放在主题目录下，每个主题一个文件夹，内含 `theme.json`：

```
%LOCALAPPDATA%\hermes\desktop-plugins\hermes-dream-skin\themes\
└── <主题名称>\
    ├── theme.json      ← 主题配置（必填）
    └── background.jpg   ← 背景图（可选，也可内嵌进 theme.json）
```

> **主题路径**：面板顶部「主题路径 (Themes Folder)」卡片显示当前扫描目录，可用 **选择文件夹** 改到其他位置。由于渲染进程无法自动获取用户目录，**默认路径不会自动填好**，需首次手动选择一次；选好后写入 Storage 并持久化，之后免选。重新加载统一用 **重新扫描**（合并原 Reload：重扫磁盘 + 重载 Storage + 重新应用当前主题）。推荐路径：
> `C:/Users/<用户名>/AppData/Local/hermes/desktop-plugins/hermes-dream-skin/themes`。

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
      "background": { "color": "#171513", "opacity": 86, "gradient": false, "glass": true },
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

> 用面板 **Add Theme** / **Edit** 创建或编辑主题时，`theme.json` 由插件自动生成并**回写磁盘**；你也可以直接编辑文件，保存后在面板点「重新扫描」生效。

### 字段说明

| 字段 | 说明 |
|------|------|
| `appearance` | 外观模式：`auto` / `light` / `dark` |
| `art.focusX` / `art.focusY` | 背景图焦点坐标 (0–1) |
| `art.safeArea` | 安全区域：`left` / `right` / `center` / `none` |
| `art.taskMode` | 任务模式：`ambient` / `banner` / `off` |
| `image` | 背景图。可写 `data:` base64（插件创建时默认），或写文件夹内的文件名（如 `background.jpg`）；也可省略此字段、直接把图片放进文件夹，插件会自动探测 |
| `styles.global` | 全局字体 / 背景 / 边框（在 Style Editor 中可视化调整） |
| `styles.areas` | 分区覆盖：`topBar` / `leftSidebar` / `chatArea` / `bottomBar`，各自可单独设 font / background / border |
| `styles.customCSS` | `:root{...}` 调色板，定义 `--ds-*` 变量（背景色、文字色、强调色、渐变遮罩等） |

## 故障排除

### 插件未显示

1. 确认插件文件夹路径正确：
   ```
   %LOCALAPPDATA%\hermes\desktop-plugins\hermes-dream-skin\plugin.js
   ```

2. 检查 `plugin.js` 文件是否存在

3. 重启 Hermes Desktop

### 主题未生效

1. 确认主题图片路径正确
2. 检查 `theme.json` 格式是否正确
3. 查看浏览器控制台（DevTools）错误信息

### 背景图显示异常

1. 确认图片格式支持（JPG、PNG、WebP）
2. 检查图片分辨率是否过大
3. 尝试使用更小的图片

## 卸载

1. 在 Settings -> Plugins 中禁用 "Hermes Dream Skin"
2. 关闭 Hermes Desktop
3. 删除插件文件夹：
   ```
   %LOCALAPPDATA%\hermes\desktop-plugins\hermes-dream-skin\
   ```

## 更新

1. 备份当前主题（复制 `themes/` 目录）
2. 下载新版本插件
3. 替换旧版本文件
4. 恢复备份的主题

## 贡献

欢迎提交 Issue 和 PR！

## 许可

MIT License
