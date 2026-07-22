# Hermes Dream Skin - 主题格式规范

## 主题目录结构

每个主题是一个独立目录，包含：

```
themes/<theme-id>/
  theme.json    # 主题配置文件
  background.jpg # 背景图（支持 .jpg, .png, .webp）
```

## theme.json 格式

```json
{
  "schemaVersion": 1,
  "id": "theme-unique-id",
  "name": "Display Name",
  "description": "Short description of the theme",
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

## 字段说明

### 基础字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `schemaVersion` | number | 是 | 主题格式版本，当前为 1 |
| `id` | string | 是 | 主题唯一标识符，只允许字母、数字、连字符、下划线 |
| `name` | string | 是 | 主题显示名称 |
| `description` | string | 否 | 主题描述 |
| `image` | string | 是 | 背景图文件名（相对路径） |
| `appearance` | string | 否 | 外观模式：`auto`（默认）、`light`、`dark` |

### Art 配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `focusX` | number (0-1) | 0.5 | 背景图焦点 X 坐标（百分比） |
| `focusY` | number (0-1) | 0.35 | 背景图焦点 Y 坐标（百分比） |
| `safeArea` | string | `center` | 安全区域：`left`、`right`、`center`、`none` |
| `taskMode` | string | `ambient` | 任务模式：`ambient`、`banner`、`off` |

### Palette 配置

| 字段 | 类型 | 说明 |
|------|------|------|
| `accent` | string | 主题强调色（CSS 颜色值） |
| `accentInk` | string | 强调色上的文字颜色 |

## 主题模式说明

### appearance

- `auto`：跟随系统/应用明暗模式自动切换
- `light`：强制使用浅色模式
- `dark`：强制使用深色模式

### art.safeArea

背景图的安全区域，用于避免重要 UI 元素被背景图遮挡：

- `left`：左侧安全（焦点在右侧）
- `right`：右侧安全（焦点在左侧）
- `center`：中心安全（焦点在边缘）
- `none`：无安全区域（全图可用）

### art.taskMode

任务页面的背景图显示模式：

- `ambient`：氛围模式（半透明背景图）
- `banner`：横幅模式（顶部横幅式背景）
- `off`：关闭（不显示背景图）

## 示例主题

### Gothic Void Crusade（深色哥特）

```json
{
  "schemaVersion": 1,
  "id": "preset-gothic-void-crusade",
  "name": "Gothic Void Crusade",
  "description": "Deep space gothic atmosphere with crimson accents",
  "image": "background.jpg",
  "appearance": "dark",
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

### Arina Hashimoto（梦幻粉彩）

```json
{
  "schemaVersion": 1,
  "id": "preset-arina-hashimoto",
  "name": "Arina Hashimoto",
  "description": "Soft pastel dreamscape with warm lighting",
  "image": "background.jpg",
  "appearance": "auto",
  "art": {
    "focusX": 0.5,
    "focusY": 0.35,
    "safeArea": "center",
    "taskMode": "ambient"
  },
  "palette": {
    "accent": "#e8a0bf",
    "accentInk": "#4a1a2e"
  }
}
```

## 图片要求

- **推荐分辨率**：2560 × 1440 (16:9) 或更高
- **推荐格式**：JPEG（质量 80-90%）、WebP
- **最大文件大小**：建议不超过 16MB
- **内容要求**：避免在画面中央放置高对比度元素，以免干扰 UI 阅读

## 导入主题

1. 将主题文件夹复制到插件的 `themes/` 目录
2. 重启 Hermes Desktop
3. 在 Dream Skin 面板中选择新主题
