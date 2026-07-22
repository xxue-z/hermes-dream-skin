# Hermes Dream Skin 主题样式编辑器升级设计

## 概述

将 Hermes Dream Skin 插件的主题系统升级为支持模块化样式配置的可视化编辑器。用户可通过控制面板设置字体、颜色、背景、边框等样式属性，并实时预览生成的 CSS 代码。

---

## 变更点

### 1. 主题卡片选中态
- 移除 `Active` 文本标签
- 选中态仅通过 `border-color: #3b82f6`（蓝色边框）+ `ring` 效果表示
- 非选中态为 `border-gray-200`

### 2. 主题 Schema 扩展（v2）

```ts
interface Theme {
  id: string
  name: string
  image: string           // 背景图 data URL
  createdAt: number
  
  styles: {
    // === 全局设置 ===
    global: {
      font: {
        family: string      // "Inter", "system-ui" 等
        size: number        // px
        color: string       // hex
      }
      background: {
        color: string
        opacity: number     // 0-1
      }
      border: {
        color: string
        width: number       // px
        radius: number      // px
      }
    }
    
    // === 分区设置 ===
    areas: {
      topBar:      AreaConfig  // 顶部工具栏
      leftSidebar: AreaConfig  // 左侧会话栏
      chatArea:    AreaConfig  // 聊天主区域
      bottomBar:   AreaConfig  // 底部状态栏
    }
    
    // === 手动 CSS 覆盖 ===
    customCSS: string
  }
}

interface AreaConfig {
  enabled: boolean       // 是否启用该区域的自定义样式
  font: { color?: string; size?: number }
  background: { color?: string; opacity?: number }
  border: { color?: string; width?: number; radius?: number }
}
```

### 3. UI 面板布局

```
┌──────────────────────────────────────────────────────┐
│ [主题列表]                                           │
│ ┌──────────┐  ┌──────────────────────────────────┐   │
│ │ 🖼️ 预设1 │  │ 编辑主题: "自定义主题"            │   │
│ │ ️ 预设2 │  │ ──────────────────────────────┐  │   │
│ │ ─────────  │  │ │ 标签: 全局 | 顶部栏 | 左侧栏 | │   │
│ │ [+ 添加]  │  │ │      聊天区 | 底部栏           │   │
│ └──────────┘  │ ├──────────────────────────────┤  │   │
│               │ │ [当前标签内容]                │  │   │
│               │ │ • 字体颜色  [ #ffffff]      │  │   │
│               │ │ • 字体大小  [━━●━━━━ 14px]    │  │   │
│               │ │ • 背景颜色  [ #000000]      │  │   │
│               │ │ • 背景透明度[━━●━━━━ 80%]    │  │   │
│               │ │ • 边框颜色  [🎨 #333333]      │  │   │
│               │ │ • 边框宽度  [━━●━━━━ 1px]     │  │   │
│               │ │ • 圆角大小  [━━●━━━━ 8px]     │  │   │
│               │ └──────────────────────────────┘  │   │
│               │ ┌──────────────────────────────  │   │
│               │ │ 💻 生成的 CSS                  │  │   │
│               │ │ ```css                        │  │   │
│               │ │ html.dream-skin-active ...    │  │   │
│               │ │ ...                           │  │   │
│               │ │ ```                           │  │   │
│               │ └──────────────────────────────┘  │   │
│               │              [💾 保存]  [ 取消]   │   │
│               └──────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

### 4. 核心模块改动

| 文件 | 改动内容 |
|---|---|
| `theme-manager.js` | `createThemeFromImage` 生成默认 `styles` 结构；新增 `updateThemeStyles(themeId, styles)` |
| `css-injector.js` | `generateCSS(theme)` 改为遍历 `theme.styles` 对象生成对应 CSS 规则 |
| `panel.js` | 引入 `StyleEditor` 组件替换现有简单面板 |
| `style-editor.js` *(新增)* | 主编辑器组件：标签切换、属性面板、CSS 预览 |
| `style-config.js` *(新增)* | 定义各区域可配置属性、默认值、CSS 选择器映射 |

### 5. CSS 生成规则

系统预定义各区域对应的 DOM 选择器映射：

```js
const AREA_SELECTORS = {
  topBar:      '[data-slot="statusbar"], div[class*="h-[34px]"]',
  leftSidebar: '[data-tree-group="grp-sessions"]',
  chatArea:    '[data-slot="composer-bounds"]',
  bottomBar:   '[data-slot="statusbar"]'
}
```

生成示例：
```css
/* 全局字体 */
html.dream-skin-active {
  --dream-skin-font-family: 'Inter';
  --dream-skin-font-size: 14px;
  --dream-skin-font-color: #ffffff;
}

/* 聊天区自定义 */
html.dream-skin-active [data-slot="composer-bounds"] {
  background-color: rgba(0,0,0,0.8) !important;
  border: 1px solid #333333 !important;
  border-radius: 8px !important;
}
```

用户手动修改的 `customCSS` 始终追加在生成规则之后，作为最高优先级覆盖。

### 6. 交互流程

1. 用户点击 **Add Theme** → 弹窗（名称 + 背景图）→ 创建主题 → 自动进入编辑器
2. 用户在编辑器中切换标签、调整滑块/取色器 → 实时更新右侧 CSS 预览（但不注入 DOM）
3. 点击 **保存** → 调用 `themeManager.updateThemeStyles()` → `cssInjector.applyTheme()` → 持久化到 storage
4. 用户可在 CSS 预览面板手动编辑 → 点击"应用自定义 CSS" → 保存到 `customCSS` 字段

---

## 设计决策

### 方案对比

| 方案 | 描述 | 优点 | 缺点 |
|---|---|---|---|
| A 纯 CSS 字符串 | 样式以原始 CSS 字符串存储 | CSS 最灵活，无中间层 | 面板CSS 双向解析复杂 |
| **B 结构化对象 + 生成式预览** | 结构化 JSON + 动态生成 CSS | 结构清晰，扩展性好，保留 CSS 自定义能力 | 需要实现 CSS结构体解析 |
| C CSS 变量绑定 | 通过 CSS 变量控制 | 实现最简单 | CSS 可读性差，非变量规则受限 |

**选定方案：B**

### 关键决策

- **适用范围**：样式配置仅用于用户自定义创建的主题，不修改内置预设主题
- **实时预览**：面板修改仅更新 CSS 预览，点击「保存」后才注入 DOM 生效
- **CSS 面板**：展示由结构化数据生成的 CSS 代码，支持用户手动编辑覆盖
- **持久化**：样式数据随主题对象一同存入 PluginStorage

---

## 风险评估

| 风险 | 缓解措施 |
|---|---|
| CSS 选择器随 Hermes Desktop 升级而失效 | 选择器使用 `data-slot` 等稳定属性，避免类名硬编码 |
| 手动 CSS 与生成规则冲突 | `customCSS` 追加在生成规则之后，天然具有更高优先级 |
| 用户输入非法颜色/数值 | 使用 Color Picker 组件 + 滑块限制输入范围 |

---

*文档版本：v1.0*  
*创建日期：2026-07-22*
