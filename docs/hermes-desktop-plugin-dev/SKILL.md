---
name: hermes-desktop-plugin-dev
version: 1.0.0
description: Advanced patterns for developing Hermes Desktop plugins with CSS injection, DOM manipulation, theme management, and IPC communication.
category: software-development
tags: [hermes, desktop, plugin, theme, css-injection]
---

# Hermes Desktop Plugin Development (Advanced)

Covers practical patterns for building non-trivial Hermes Desktop plugins — especially those that inject CSS, manipulate the DOM, load local resources, and manage state across the app surface. Complements the bundled `hermes-desktop-plugins` skill (which covers the registration API); this skill fills in the implementation details discovered in real plugins.

## When to Use

- Building a plugin that needs to inject custom CSS (themes, skins, UI overrides)
- Loading local files (images, JSON) from the plugin directory
- Finding and targeting Hermes Desktop DOM elements reliably
- Creating a plugin settings panel with React (no JSX / build step)
Skill: [hermes-desktop-plugin-dev](skill:hermes-desktop-plugin-dev)

## Support Files

- `references/plugin-navigation-registration.md` — Full sidebar nav registration details, codicon names, and React patterns
- `references/hermes-dom-selectors.md` — Verified DOM selectors for CSS injection
- `references/react-hooks-bundling.md` — React hooks bundling and deduplication patterns

## Core Patterns

### Sidebar Navigation Registration

To add an item to the left sidebar navigation (below "New Session", "Skills", etc.), register BOTH a route and a sidebar nav entry:

```javascript
export default {
  id: 'my-plugin',
  register(ctx) {
    // 1. Register the route (the page content)
    ctx.register({
      id: 'my-plugin-route',
      area: 'routes',
      data: { path: '/my-plugin' },
      render: () => React.createElement(MyPanel)
    })

    // 2. Register the sidebar nav item
    ctx.register({
      id: 'my-plugin-nav',
      area: 'sidebar.nav',
      data: {
        codicon: 'symbol-color',  // VS Code codicon name
        label: 'My Plugin',
        path: '/my-plugin'
      }
    })
  }
}
```

**Common mistakes:**
- `area: 'nav'` — Does not render in sidebar
- `area: 'SIDEBAR_NAV_AREA'` — Does not render in sidebar
- `area: 'panes'` — Creates a layout pane instead
- `area: 'secondarySidebar'` — Creates a secondary panel instead
- Missing `path` in nav `data` — Nav item appears but doesn't navigate
- Invalid `codicon` value — Nav item shows text but no icon (use valid VS Code codicon names like `symbol-color`)

**Valid area values for navigation:**
- `'routes'` — Registers a route/page
- `'sidebar.nav'` — Registers a sidebar navigation item
- `'panes'` — Registers a layout pane
- `'statusBar.right'` / `'statusBar.left'` — Status bar chips

### 1. CSS Injection for Translucent Themes

The canonical approach for a "skin" plugin:

```javascript
const STYLE_ID = 'my-plugin-style'

function injectStyle(cssVars) {
  // Remove previous style if re-applying
  const existing = document.getElementById(STYLE_ID)
  if (existing) existing.remove()

  const css = document.createElement('style')
  css.id = STYLE_ID
  css.textContent = cssVars
  document.head.appendChild(css)
}
```

Key CSS patterns that work in Hermes:

```css
/* Override Hermes CSS variables globally */
html.my-plugin-active {
  --ui-chat-surface-background: transparent !important;
  --ui-sidebar-surface-background: transparent !important;
}

/* Target specific regions by data-slot or data-tree-group */
html.my-plugin-active [data-tree-group="grp-main"] {
  background: rgba(0, 0, 0, 0.25) !important;
  backdrop-filter: blur(30px) saturate(1.1) !important;
}
```

**Pitfall: `backdrop-filter` needs a semi-transparent background**
- `background: transparent` + `backdrop-filter` = invisible / broken
- Must use `background: rgba(0,0,0,0.25)` (or any partial opacity)

**Pitfall: Sticky elements with transparent backgrounds**
- `position: sticky` + transparent background = overlaps content when scrolled
- Fix: Add `.sticky { background-color: rgba(0,0,0,0.6) !important; }`

**Pitfall: Recursive `*` selectors**
- `[data-role="user"] *` affects ALL nested elements (code blocks, buttons, etc.)
- Prefer `[data-role="user"] > div` for immediate children only

### 2. Loading Local Images via IPC

Relative paths (`themes/preset/background.jpg`) resolve incorrectly in Electron — they point to `app.asar/dist/` instead of the plugin directory. Use the Hermes Desktop IPC bridge:

```javascript
const imagePath = 'C:/Users/<user>/AppData/Local/hermes/desktop-plugins/<plugin-id>/themes/preset/background.jpg'
const dataUrl = await window.hermesDesktop.readFileDataUrl(imagePath)
// Returns: "data:image/jpeg;base64,/9j/4AAQ..."
```

**Always use forward slashes** in the path, even on Windows.

### 3. Fixed Background Div Technique

Instead of setting `background-image` on `body` (can be overridden), create a dedicated div:

```javascript
let bgEl = document.getElementById('my-plugin-bg')
if (!bgEl) {
  bgEl = document.createElement('div')
  bgEl.id = 'my-plugin-bg'
  document.body.insertBefore(bgEl, document.body.firstChild)
}
bgEl.style.cssText = `
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  pointer-events: none;
  background-image: url("${imageUrl}");
  background-size: cover;
  background-position: center;
`
```

**No `z-index` needed** — inserting as `body.firstChild` naturally places it behind everything.

### 4. Hermes Desktop DOM Selectors (Verified)

These selectors were discovered by inspecting the actual Hermes Desktop DOM:

| Region | Selector | Class/Attribute |
|--------|----------|---------------|
| Chat content area | `[data-tree-group="grp-main"]` | `bg-(--ui-bg-editor)` |
| Sidebar | `[data-tree-group="grp-sessions"]` | `bg-(--ui-bg-editor)` |
| Sidebar group | `[data-slot="sidebar-group"]` | Sessions, tools, search |
| Top toolbar | `div[class*="h-[34px]"]` | Fixed 34px height |
| Bottom statusbar | `[data-slot="statusbar"]` | Footer bar |
| User message | `[data-role="user"]` | Includes `group/user-message sticky` |
| User bubble actions | `[data-slot="aui_user-bubble-actions"]` | Message actions |
| Thread viewport | `[data-slot="aui_thread-viewport"]` | Scrollable message list |
| Composer bounds | `[data-slot="composer-bounds"]` | Outer composer |
| Composer surface | `[data-slot="composer-surface"]` | Input box wrapper |

### 5. Plugin Panel with React (No JSX)

Hermes Desktop plugins use React but **no JSX / build step**. Use `React.createElement`:

```javascript
const React = window.__HERMES_REACT__ || globalThis.__HERMES_REACT__
const { useState, useEffect, useCallback } = React

function MyPanel({ themeManager }) {
  const [themes, setThemes] = useState(() => themeManager.getAllThemes())

  return React.createElement('div', { className: 'p-4' },
    React.createElement('h2', null, 'My Plugin'),
    // ...
  )
}
```

### 6. Development Workflow

1. **Edit**: Modify `plugin.js` in `desktop-plugins/<name>/`
2. **Validate**: `node --check plugin.js` (catches syntax errors)
3. **Reload**: In Hermes Desktop, ⌘K → **Reload desktop plugins**
4. **Debug**: Open DevTools (Ctrl+Shift+I) to see console errors
5. **Iterate**: Fix and repeat

**No `npm run build`** — this is a plain JavaScript file executed by the renderer process.

### 7. Plugin State with `PluginStorage`

```javascript
// In plugin.register(ctx):
ctx.storage.set('my-key', JSON.stringify(data))
const data = JSON.parse(ctx.storage.get('my-key', '{}'))
```

### 8. Multi-Module Plugin Build (Bundling)

Hermes Desktop loads a **single `plugin.js`** file. For non-trivial plugins, splitting code into multiple files under `src/` improves maintainability, but you must bundle them into one file.

**Critical: Import React explicitly at the top of `plugin.js`**

Because Hermes Desktop loads plugins as ES modules (`<script type="module">`), `React` is **not** available as a global variable. You must import it explicitly:

```javascript
// ✅ REQUIRED — first line of plugin.js
import React from 'react'
```

`window.React` is `undefined` in ESM scope — do not rely on it.

**Recommended approach: avoid destructuring React hooks**

The simplest and most reliable pattern is to never destructure React hooks. Always use `React.useState`, `React.useEffect`, etc. directly. This eliminates the deduplication problem entirely.

**In every source module, write:**

```javascript
// ✅ CORRECT — no deduplication needed
function MyComponent() {
  const [count, setCount] = React.useState(0)
  const ref = React.useRef(null)
  React.useEffect(() => { /* ... */ }, [])
  // ...
}
```

**NOT:**

```javascript
// ❌ WRONG — causes "Identifier 'useState' has already been declared"
const { useState, useEffect } = React  // DON'T DO THIS

function MyComponent() {
  const [count, setCount] = useState(0)
  // ...
}
```

**Recommended `build.mjs`:**

```javascript
import fs from 'node:fs'
import path from 'node:path'

const srcDir = path.join(process.cwd(), 'src')
const outputFile = path.join(process.cwd(), 'plugin.js')

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')

  // Strip all ESM import/export (bundled into one scope)
  content = content.replace(/^import\s+.*?\s*from\s*['"][^'"]+['"];?\n?/gm, '')
  content = content.replace(/^import\s+['"][^'"]+['"];?\n?/gm, '')
  content = content.replace(/export\s*\{[^}]*\}\s*from\s*['"][^'"]+['"];?\n?/g, '')
  content = content.replace(/export\s+(class|function|const|let|var)\s+/g, '$1 ')
  content = content.replace(/export\s+default\s+/, 'const __DEFAULT_EXPORT__ = ')

  return content.trim()
}

function build(files) {
  let output = ''
  for (const file of files) {
    const processed = processFile(path.join(srcDir, file))
    output += `// --- ${file} ---\n${processed}\n\n`
  }
  output += `export default { id: 'my-plugin', register(ctx) { new MyPlugin(ctx).init() } }\n`
  fs.writeFileSync(outputFile, output)
}

// Order: least-dependent modules first
build(['style-config.js', 'style-editor.js', 'theme-manager.js', 'css-injector.js', 'ui/panel.js', 'index.js'])
```

**Pitfall: Module-top-level `React` access at build time vs runtime**

In ES module strict mode, `React` is not globally available — you must access it via `window.React`. However, even `const { useState } = React` at module top-level can fail with `ReferenceError: React is not defined` if the module evaluates before `React` is bound. Using `React.useState` defers the property access until function call time, which is always after `React` is available.

**Verification:**
- Search `plugin.js` for `const { useState` / `const { useEffect` — should appear zero times
- Search for `import` / `export class` / `export function` — should be absent (except the final `export default`)
- Search for `React.use` — should appear in all component code
- `node --check plugin.js` should pass

## Verification

- Plugin loads without console errors after ⌘K → Reload desktop plugins
- CSS selectors match actual DOM (use DevTools to verify)
- Background images load via `readFileDataUrl` (check Network tab)
- `backdrop-filter` effects are visible (requires semi-transparent background)
- Multi-module builds produce a single `plugin.js` with no duplicate declarations
