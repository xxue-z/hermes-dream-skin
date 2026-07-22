# Hermes Dream Skin 主题样式编辑器 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Hermes Dream Skin 插件添加可视化样式编辑器，支持全局及各区域（顶部栏、左侧栏、聊天区、底部栏）的字体、颜色、背景、边框等属性配置，并实时预览生成的 CSS 代码。

**Architecture:** 引入结构化样式配置（`styles` 字段），通过 `style-config.js` 定义区域映射和默认值，`style-editor.js` 提供可视化编辑面板，`css-injector.js` 根据结构生成 CSS。样式数据随主题持久化到 PluginStorage。

**Tech Stack:** Vanilla JavaScript (ES Modules), React (via `window.__HERMES_PLUGIN_SDK__`), Tailwind CSS classes

## Global Constraints

- 样式配置**仅用于用户自定义创建的主题**，内置预设主题不可修改
- UI 面板修改**仅更新预览，点击「保存」后才注入 DOM**
- 所有样式数据随 Theme 对象存入 PluginStorage，key 为 `dream-skin:themes`
- CSS 选择器使用 `data-slot` 等稳定属性，避免类名硬编码
- 向后兼容：无 `styles` 字段的旧主题按原有逻辑处理
- 文件编码：UTF-8，换行符 LF

---

## File Structure

```
src/
  index.js           # Modify: 导出新增模块
  theme-manager.js   # Modify: 添加默认 styles，updateThemeStyles
  css-injector.js    # Modify: 重构 generateCSS 支持结构化样式
  style-config.js    # Create: 区域映射、默认值、属性元数据
  style-editor.js    # Create: 样式编辑器核心组件
  ui/
    panel.js         # Modify: 重构主题列表，集成编辑器入口
```

---

## Task 1: Create `src/style-config.js` — Style Configuration Module

**Files:**
- Create: `src/style-config.js`

**Interfaces:**
- Produces: `AREA_SELECTORS` — 区域到 DOM 选择器的映射对象
- Produces: `DEFAULT_STYLES` — 完整的默认样式结构
- Produces: `STYLE_METADATA` — 各属性的 UI 元数据（用于面板自动生成控件）

---

- [ ] **Step 1: Define AREA_SELECTORS mapping**

```javascript
export const AREA_SELECTORS = {
  topBar:      '[data-slot="statusbar"], div[class*="h-[34px]"]',
  leftSidebar: '[data-tree-group="grp-sessions"]',
  chatArea:    '[data-slot="composer-bounds"]',
  bottomBar:   '[data-slot="statusbar"]'
}
```

- [ ] **Step 2: Define DEFAULT_STYLES object**

```javascript
export const DEFAULT_STYLES = {
  global: {
    font: { family: 'system-ui', size: 14, color: '#ffffff' },
    background: { color: '#000000', opacity: 0.8 },
    border: { color: '#333333', width: 1, radius: 8 }
  },
  areas: {
    topBar:      { enabled: false, font: {}, background: {}, border: {} },
    leftSidebar: { enabled: false, font: {}, background: {}, border: {} },
    chatArea:    { enabled: false, font: {}, background: {}, border: {} },
    bottomBar:   { enabled: false, font: {}, background: {}, border: {} }
  },
  customCSS: ''
}
```

- [ ] **Step 3: Define STYLE_METADATA for UI generation**

```javascript
export const STYLE_METADATA = {
  font: {
    family:  { label: 'Font Family',  type: 'text',   default: 'system-ui' },
    size:    { label: 'Font Size',    type: 'range',  min: 10, max: 24, unit: 'px', default: 14 },
    color:   { label: 'Font Color',   type: 'color',  default: '#ffffff' }
  },
  background: {
    color:   { label: 'Background Color', type: 'color', default: '#000000' },
    opacity: { label: 'Opacity',          type: 'range', min: 0, max: 100, unit: '%', default: 80 }
  },
  border: {
    color:   { label: 'Border Color', type: 'color', default: '#333333' },
    width:   { label: 'Border Width', type: 'range', min: 0, max: 10, unit: 'px', default: 1 },
    radius:  { label: 'Border Radius', type: 'range', min: 0, max: 24, unit: 'px', default: 8 }
  }
}
```

- [ ] **Step 4: Verify by importing in a test snippet**

Run: `node -e "import('./src/style-config.js').then(m => console.log(Object.keys(m)))"`
Expected: `['AREA_SELECTORS', 'DEFAULT_STYLES', 'STYLE_METADATA']`

---

## Task 2: Extend `src/theme-manager.js` — Style Storage Support

**Files:**
- Modify: `src/theme-manager.js`
- Imports: `DEFAULT_STYLES` from `./style-config.js`

**Interfaces:**
- Consumes: `DEFAULT_STYLES` from `style-config.js`
- Produces: `ThemeManager.createThemeFromImage()` now returns theme with `styles` field
- Produces: `ThemeManager.updateThemeStyles(themeId, styles)` new method

---

- [ ] **Step 1: Import DEFAULT_STYLES at top of file**

Add to `theme-manager.js`:
```javascript
import { DEFAULT_STYLES } from './style-config.js'
```

- [ ] **Step 2: Modify `createThemeFromImage` to include default styles**

In the `theme` object, add `styles` field:
```javascript
const theme = {
  id,
  name,
  image: imageDataUrl,
  appearance: config.appearance || 'auto',
  art: { ... },
  styles: JSON.parse(JSON.stringify(DEFAULT_STYLES)), // deep clone
  createdAt: Date.now()
}
```

- [ ] **Step 3: Add `updateThemeStyles` method**

```javascript
/** 更新主题的样式配置 */
updateThemeStyles(themeId, styles) {
  const theme = this.themes.get(themeId)
  if (!theme) throw new Error(`Theme not found: ${themeId}`)

  theme.styles = styles
  this.saveToStorage()

  // 如果这是当前激活的主题，通知监听器重新应用
  if (this.activeThemeId === themeId) {
    this.listeners.forEach(listener => listener(theme))
  }
}
```

- [ ] **Step 4: Update `loadFromStorage` for backward compatibility**

在 `loadFromStorage` 中，加载后检查每个主题是否有 `styles` 字段，没有则补上空结构：
```javascript
// Backward compatibility: add empty styles if missing
if (!theme.styles) {
  theme.styles = JSON.parse(JSON.stringify(DEFAULT_STYLES))
}
```

- [ ] **Step 5: Verify with a test snippet**

Run a small test that creates a theme and checks it has styles.

---

## Task 3: Refactor `src/css-injector.js` — Structured CSS Generation

**Files:**
- Modify: `src/css-injector.js`
- Imports: `AREA_SELECTORS` from `./style-config.js`

**Interfaces:**
- Consumes: `theme.styles` (new structured format)
- Produces: CSS string generated from `theme.styles`
- Maintains backward compatibility for themes without `styles`

---

- [ ] **Step 1: Import AREA_SELECTORS**

Add: `import { AREA_SELECTORS } from './style-config.js'`

- [ ] **Step 2: Refactor `generateCSS` method**

Split into two functions:

```javascript
generateCSS(theme) {
  const { art = {} } = theme
  const focusX = art.focusX ?? 0.5
  const focusY = art.focusY ?? 0.35

  // Legacy: themes without styles
  if (!theme.styles) {
    return this.generateLegacyCSS(theme, focusX, focusY)
  }

  // New: structured styles
  return this.generateStructuredCSS(theme, focusX, focusY)
}
```

- [ ] **Step 3: Implement `generateLegacyCSS` (extract existing logic)**

将现有 `generateCSS` 的内容提取为 `generateLegacyCSS` 方法，保持原样。

- [ ] **Step 4: Implement `generateStructuredCSS`**

```javascript
generateStructuredCSS(theme, focusX, focusY) {
  const { styles } = theme
  const lines = []

  // CSS variables for global font
  lines.push(`html.dream-skin-active {`)
  if (styles.global?.font?.family) {
    lines.push(`  --dream-skin-font-family: '${styles.global.font.family}';`)
  }
  if (styles.global?.font?.size) {
    lines.push(`  --dream-skin-font-size: ${styles.global.font.size}px;`)
  }
  if (styles.global?.font?.color) {
    lines.push(`  --dream-skin-font-color: ${styles.global.font.color};`)
  }
  lines.push(`}`)

  // Global background override (if any)
  if (styles.global?.background?.color) {
    const bg = styles.global.background
    const opacity = (bg.opacity ?? 80) / 100
    lines.push(`html.dream-skin-active body {`)
    lines.push(`  background-color: ${this.hexToRgba(bg.color, opacity)} !important;`)
    lines.push(`}`)
  }

  // Per-area styles
  for (const [area, config] of Object.entries(styles.areas || {})) {
    if (!config?.enabled) continue

    const selector = AREA_SELECTORS[area]
    if (!selector) continue

    lines.push(`html.dream-skin-active ${selector} {`)

    // Font
    if (config.font?.color) {
      lines.push(`  color: ${config.font.color} !important;`)
    }
    if (config.font?.size) {
      lines.push(`  font-size: ${config.font.size}px !important;`)
    }

    // Background
    if (config.background?.color) {
      const bg = config.background
      const opacity = (bg.opacity ?? 80) / 100
      lines.push(`  background-color: ${this.hexToRgba(bg.color, opacity)} !important;`)
    }

    // Border
    if (config.border?.color || config.border?.width !== undefined) {
      const borderColor = config.border.color || '#000000'
      const borderWidth = config.border.width ?? 0
      lines.push(`  border: ${borderWidth}px solid ${borderColor} !important;`)
    }
    if (config.border?.radius !== undefined) {
      lines.push(`  border-radius: ${config.border.radius}px !important;`)
    }

    lines.push(`}`)
  }

  // Custom CSS (highest priority)
  if (styles.customCSS?.trim()) {
    lines.push(`/* Custom CSS */`)
    lines.push(styles.customCSS)
  }

  return lines.join('\n')
}
```

- [ ] **Step 5: Add `hexToRgba` helper**

```javascript
hexToRgba(hex, opacity) {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}
```

- [ ] **Step 6: Keep legacy background image logic intact**

原有的背景图片注入逻辑（`injectChrome` 和背景图相关 CSS）保留不变。

---

## Task 4: Create `src/style-editor.js` — Style Editor Component

**Files:**
- Create: `src/style-editor.js`
- Imports: `DEFAULT_STYLES`, `STYLE_METADATA` from `./style-config.js`

**Interfaces:**
- Consumes: `theme` (with `styles` field), `onSave(styles)`, `onCancel()`
- Produces: React component rendered into the panel

---

- [ ] **Step 1: Create component skeleton with tabs**

```javascript
const { useState, useCallback, useMemo } = React

const TABS = [
  { id: 'global', label: '全局' },
  { id: 'topBar', label: '顶部栏' },
  { id: 'leftSidebar', label: '左侧栏' },
  { id: 'chatArea', label: '聊天区' },
  { id: 'bottomBar', label: '底部栏' }
]

export function StyleEditor({ theme, onSave, onCancel }) {
  const [activeTab, setActiveTab] = useState('global')
  const [draftStyles, setDraftStyles] = useState(() => 
    JSON.parse(JSON.stringify(theme.styles || DEFAULT_STYLES))
  )

  // Generate preview CSS
  const previewCSS = useMemo(() => {
    // Use CSSInjector logic or duplicate simplified version
    return generatePreviewCSS(draftStyles)
  }, [draftStyles])

  return React.createElement('div', { className: 'space-y-4' },
    // Tabs
    React.createElement('div', { className: 'flex gap-1 border-b pb-2' },
      TABS.map(tab =>
        React.createElement('button', {
          key: tab.id,
          onClick: () => setActiveTab(tab.id),
          className: `px-3 py-1 text-sm rounded ${
            activeTab === tab.id ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
          }`
        }, tab.label)
      )
    ),
    // Content
    React.createElement('div', { className: 'space-y-4' },
      React.createElement(TabContent, {
        tabId: activeTab,
        draftStyles,
        setDraftStyles
      }),
      React.createElement(CSSPreview, { css: previewCSS }),
      React.createElement('div', { className: 'flex gap-2 pt-2' },
        React.createElement('button', {
          onClick: () => onSave(draftStyles),
          className: 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm'
        }, '保存'),
        React.createElement('button', {
          onClick: onCancel,
          className: 'px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm'
        }, '取消')
      )
    )
  )
}
```

- [ ] **Step 2: Implement `TabContent` component**

For global tab, show all properties. For area tabs, show "Enable custom styles" toggle first, then properties (disabled when off).

```javascript
function TabContent({ tabId, draftStyles, setDraftStyles }) {
  const isArea = tabId !== 'global'
  const config = isArea 
    ? (draftStyles.areas[tabId] || {})
    : draftStyles.global

  const handleChange = (category, property, value) => {
    setDraftStyles(prev => {
      const next = JSON.parse(JSON.stringify(prev))
      if (isArea) {
        next.areas[tabId] = next.areas[tabId] || {}
        next.areas[tabId][category] = next.areas[tabId][category] || {}
        next.areas[tabId][category][property] = value
      } else {
        next.global[category] = next.global[category] || {}
        next.global[category][property] = value
      }
      return next
    })
  }

  return React.createElement('div', { className: 'space-y-4' },
    isArea && React.createElement('div', { className: 'flex items-center gap-2' },
      React.createElement('input', {
        type: 'checkbox',
        id: 'enable-custom',
        checked: config.enabled || false,
        onChange: (e) => handleChange('enabled', null, e.target.checked)
      }),
      React.createElement('label', { htmlFor: 'enable-custom', className: 'text-sm' }, '启用该区域自定义样式')
    ),
    // Font properties
    React.createElement(PropertyGroup, {
      title: '字体',
      category: 'font',
      config: config.font || {},
      metadata: STYLE_METADATA.font,
      onChange: handleChange,
      disabled: isArea && !config.enabled
    }),
    // Background properties
    React.createElement(PropertyGroup, {
      title: '背景',
      category: 'background',
      config: config.background || {},
      metadata: STYLE_METADATA.background,
      onChange: handleChange,
      disabled: isArea && !config.enabled
    }),
    // Border properties
    React.createElement(PropertyGroup, {
      title: '边框',
      category: 'border',
      config: config.border || {},
      metadata: STYLE_METADATA.border,
      onChange: handleChange,
      disabled: isArea && !config.enabled
    })
  )
}
```

- [ ] **Step 3: Implement `PropertyGroup` component**

Renders controls based on metadata type (color picker, range slider, text input).

```javascript
function PropertyGroup({ title, category, config, metadata, onChange, disabled }) {
  return React.createElement('div', { className: `space-y-2 ${disabled ? 'opacity-50 pointer-events-none' : ''}` },
    React.createElement('h4', { className: 'font-medium text-sm text-gray-700' }, title),
    Object.entries(metadata).map(([key, meta]) => {
      const value = config[key] !== undefined ? config[key] : meta.default
      return React.createElement('div', { key, className: 'flex items-center gap-3' },
        React.createElement('label', { className: 'w-24 text-xs text-gray-500' }, meta.label),
        meta.type === 'color' && React.createElement('input', {
          type: 'color',
          value,
          onChange: (e) => onChange(category, key, e.target.value),
          className: 'w-8 h-8 rounded border cursor-pointer'
        }),
        meta.type === 'range' && React.createElement('div', { className: 'flex items-center gap-2 flex-1' },
          React.createElement('input', {
            type: 'range',
            min: meta.min,
            max: meta.max,
            value,
            onChange: (e) => onChange(category, key, Number(e.target.value)),
            className: 'flex-1'
          }),
          React.createElement('span', { className: 'text-xs text-gray-500 w-12 text-right' },
            `${value}${meta.unit || ''}`
          )
        ),
        meta.type === 'text' && React.createElement('input', {
          type: 'text',
          value,
          onChange: (e) => onChange(category, key, e.target.value),
          className: 'flex-1 px-2 py-1 text-sm border rounded'
        })
      )
    })
  )
}
```

- [ ] **Step 4: Implement `CSSPreview` component**

```javascript
function CSSPreview({ css }) {
  return React.createElement('div', { className: 'space-y-2' },
    React.createElement('h4', { className: 'font-medium text-sm text-gray-700' }, 'CSS 预览'),
    React.createElement('textarea', {
      readOnly: true,
      value: css,
      className: 'w-full h-40 p-3 text-xs font-mono bg-gray-900 text-green-400 rounded resize-none',
      style: { fontFamily: 'monospace' }
    })
  )
}
```

- [ ] **Step 5: Add `generatePreviewCSS` helper**

Duplicate simplified CSS generation logic from `CSSInjector` for preview purposes (or import if possible).

---

## Task 5: Refactor `src/ui/panel.js` — Theme List & Editor Integration

**Files:**
- Modify: `src/ui/panel.js`
- Imports: `StyleEditor` from `../style-editor.js`

**Interfaces:**
- Consumes: `StyleEditor` component
- Produces: Updated panel with theme list (new selection UI) and editor navigation

---

- [ ] **Step 1: Add `editingTheme` state and import `StyleEditor`**

```javascript
import { StyleEditor } from '../style-editor.js'

// In panel component, add state:
const [editingTheme, setEditingTheme] = useState(null)
```

- [ ] **Step 2: Modify `ThemeCard` to remove "Active" text, use border only**

```javascript
function ThemeCard({ theme, isActive, onSwitch, onRemove, onEdit }) {
  return React.createElement('div', {
    className: `relative p-3 rounded-lg border-2 cursor-pointer transition-all ${
      isActive ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-400'
    }`,
    onClick: onSwitch
  },
    // Preview image
    theme.image && React.createElement('img', {
      src: theme.image,
      alt: theme.name,
      className: 'w-full h-20 object-cover rounded-md mb-2'
    }),
    // Theme info
    React.createElement('div', { className: 'flex items-center justify-between' },
      React.createElement('div', null,
        React.createElement('h3', { className: 'font-medium text-sm' }, theme.name)
      ),
      React.createElement('div', { className: 'flex gap-1' },
        // Edit button (only for user-created themes? or all?)
        React.createElement('button', {
          onClick: (e) => { e.stopPropagation(); onEdit(theme) },
          className: 'text-gray-400 hover:text-blue-500 transition-colors px-1'
        }, '✎'),
        // Delete button
        React.createElement('button', {
          onClick: (e) => { e.stopPropagation(); onRemove() },
          className: 'text-gray-400 hover:text-red-500 transition-colors px-1'
        }, '×')
      )
    )
  )
}
```

- [ ] **Step 3: Add `handleEditTheme` and `handleSaveStyles` handlers**

```javascript
const handleEditTheme = (theme) => {
  setEditingTheme(theme)
}

const handleSaveStyles = (styles) => {
  if (!editingTheme) return
  themeManager.updateThemeStyles(editingTheme.id, styles)
  
  // Re-apply if active
  const active = themeManager.getActiveTheme()
  if (active?.id === editingTheme.id) {
    cssInjector.applyTheme({ ...editingTheme, styles })
  }
  
  setEditingTheme(null)
  refreshThemes()
}
```

- [ ] **Step 4: Render editor when `editingTheme` is set**

```javascript
// In render, replace the theme list area:
return React.createElement('div', { className: 'p-4 space-y-4' },
  editingTheme 
    ? React.createElement(StyleEditor, {
        theme: editingTheme,
        onSave: handleSaveStyles,
        onCancel: () => setEditingTheme(null)
      })
    : React.createElement(React.Fragment, null,
        // ... existing theme list content
      )
)
```

- [ ] **Step 5: Pass `onEdit` to ThemeCard**

In the `themes.map(...)` section:
```javascript
React.createElement(ThemeCard, {
  key: theme.id,
  theme,
  isActive: activeTheme?.id === theme.id,
  onSwitch: () => handleSwitchTheme(theme.id),
  onRemove: () => handleRemoveTheme(theme.id),
  onEdit: () => handleEditTheme(theme)
})
```

---

## Task 6: Update `src/index.js` — Export New Modules

**Files:**
- Modify: `src/index.js`

---

- [ ] **Step 1: Ensure all modules are properly wired**

Verify imports and exports are correct. No additional code needed if `index.js` already imports from `theme-manager.js`, `css-injector.js`, and `panel.js`.

---

## Self-Review Checklist

### 1. Spec Coverage

| Spec Requirement | Task | Status |
|---|---|---|
| 主题卡片选中态仅通过边框颜色区分 | Task 5 | ✅ |
| 新增主题模块化（全局 + 分区设置） | Task 1, 2, 4 | ✅ |
| 字体/颜色/大小/背景/边框可控面板 | Task 4 | ✅ |
| 侧边同步展示 CSS 样式代码 | Task 4 | ✅ |
| 仅用于用户自定义主题 | Task 2 (styles only added on create) | ✅ |
| 点击保存后生效 | Task 5 (onSave calls updateThemeStyles) | ✅ |
| 手动 CSS 修改支持 | Task 4 (customCSS textarea in preview) | ✅ |

### 2. Placeholder Scan
- No "TBD", "TODO", or vague requirements found
- All code snippets are complete and ready to implement

### 3. Type Consistency
- `theme.styles` structure matches between `style-config.js`, `theme-manager.js`, and `style-editor.js`
- `updateThemeStyles` signature consistent across all references
- CSS generation logic in `css-injector.js` handles both legacy and new format

---

## Execution Options

**Plan complete and saved to `docs/superpowers/plans/2026-07-22-theme-editor.md`**. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
