# Hermes Desktop Plugin Navigation Registration Details

## Correct Sidebar Nav Registration

```js
export default {
  id: 'my-plugin',
  register(ctx) {
    // 1. Register the route (the page content)
    const routeDispose = ctx.register({
      id: 'my-plugin-route',
      area: 'routes',
      data: { path: '/my-plugin' },
      render: () => React.createElement(MyPanel)
    })

    // 2. Register the sidebar nav item
    const navDispose = ctx.register({
      id: 'my-plugin-nav',
      area: 'sidebar.nav',
      data: {
        codicon: 'symbol-color',  // VS Code codicon name
        label: 'My Plugin',
        path: '/my-plugin'
      }
    })

    // Both disposers must be tracked for cleanup
    return () => {
      routeDispose()
      navDispose()
    }
  }
}
```

## Why `area: 'sidebar.nav'` is Required

The Hermes Desktop plugin system has multiple "areas" where you can register UI contributions. For sidebar navigation, only `sidebar.nav` works.

| Area Value | Result |
|-----------|--------|
| `'sidebar.nav'` | ✅ Correct — Appears in left sidebar nav |
| `'nav'` | ❌ Renders elsewhere or not at all |
| `'SIDEBAR_NAV_AREA'` | ❌ String value is invalid |
| `'panes'` | ❌ Creates a layout pane |
| `'secondarySidebar'` | ❌ Creates a secondary panel |

## Codicon Names

The `codicon` field accepts VS Code codicon names. These are the same icon names used in VS Code's UI.

**Common codicons for plugins:**
- `symbol-color` — Paintbrush/palette (for theme/skin plugins)
- `paintbrush` — May not render (not a valid codicon in some versions)
- `project` — Project/folder
- `settings` — Gear
- `extensions` — Puzzle piece
- `bookmark` — Bookmark
- `star` — Star

**Full list:** https://microsoft.github.io/vscode-codicons/dist/codicon.html

## React in Plugins

In single-file built plugins, React hooks should use the global `React` object:

```js
// ✅ Correct (single-file plugin, built output)
React.useState(...)
React.useEffect(...)
React.useCallback(...)

// ❌ Wrong (causes "React is not defined" in ES module strict mode)
const { useState } = React
useState(...)
```

## References

- Hermes Desktop Plugin SDK docs: https://hermes-agent.nousresearch.com/docs/developer-guide/desktop-plugin-sdk
- VS Code Codicons: https://microsoft.github.io/vscode-codicons/dist/codicon.html
