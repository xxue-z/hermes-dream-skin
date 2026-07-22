# Hermes Dream Skin - 安装和使用指南

## 快速安装

### 方式一：直接复制（推荐）

1. **关闭 Hermes Desktop**

2. **复制插件文件夹**到桌面插件目录：
   ```
   %LOCALAPPDATA%\hermes\desktop-plugins\hermes-dream-skin\
   ```

   如果 `desktop-plugins` 目录不存在，请手动创建。

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

### 添加新主题

1. 在 Hermes Desktop 侧边栏找到 **Dream Skin** 图标
2. 点击 **"Add Theme"** 按钮
3. 输入主题名称（如 "My Theme"）
4. 选择背景图片（支持 JPG、PNG、WebP）
5. 点击 **Save** 保存

### 切换主题

1. 打开 Dream Skin 面板
2. 点击想要应用的主题卡片
3. 主题立即生效

### 删除主题

1. 在 Dream Skin 面板中找到要删除的主题
2. 点击主题卡片右上角的 **×** 按钮
3. 确认删除

### 导入预设主题

1. 将预设主题文件夹复制到：
   ```
   %LOCALAPPDATA%\hermes\desktop-plugins\hermes-dream-skin\themes\
   ```

2. 重启 Hermes Desktop

3. 在 Dream Skin 面板中选择新导入的主题

## 主题配置

### 自定义主题参数

编辑 `themes/<theme-id>/theme.json` 文件：

```json
{
  "schemaVersion": 1,
  "id": "my-custom-theme",
  "name": "My Custom Theme",
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

### 参数说明

| 参数 | 说明 | 示例 |
|------|------|------|
| `appearance` | 外观模式：`auto`/`light`/`dark` | `"auto"` |
| `art.focusX` | 背景图焦点 X 坐标 (0-1) | `0.5` |
| `art.focusY` | 背景图焦点 Y 坐标 (0-1) | `0.35` |
| `art.safeArea` | 安全区域：`left`/`right`/`center`/`none` | `"center"` |
| `art.taskMode` | 任务模式：`ambient`/`banner`/`off` | `"ambient"` |
| `palette.accent` | 强调色 | `"#8b0000"` |
| `palette.accentInk` | 强调色上的文字色 | `"#ffcccc"` |

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
