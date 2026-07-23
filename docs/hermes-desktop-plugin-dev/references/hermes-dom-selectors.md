# Hermes Desktop DOM Selectors Reference

Verified DOM selectors from actual Hermes Desktop runtime (v2026.07).

## Layout Elements

| Region | Selector | Class / Notes |
|--------|----------|---------------|
| Chat content area | `[data-tree-group="grp-main"]` | `bg-(--ui-bg-editor)`, main chat viewport |
| Sidebar | `[data-tree-group="grp-sessions"]` | `bg-(--ui-bg-editor)` |
| Sidebar group | `[data-slot="sidebar-group"]` | Contains sessions, tools, search |
| Top toolbar | `div[class*="h-[34px]"]` | Fixed 34px height |
| Bottom statusbar | `[data-slot="statusbar"]` | Footer bar |

## Chat Messages

| Element | Selector | Notes |
|---------|----------|-------|
| User message root | `[data-role="user"]` | Top-level div with `group/user-message sticky z-40` |
| User bubble actions | `[data-slot="aui_user-bubble-actions"]` | Actions wrapper inside user message |
| Thread viewport | `[data-slot="aui_thread-viewport"]` | Scrollable message list |
| Assistant message | `[data-slot="aui_assistant-message-root"]` | Assistant message root (inferred) |

## Input Area

| Element | Selector | Notes |
|---------|----------|-------|
| Composer bounds | `[data-slot="composer-bounds"]` | Outer composer container |
| Composer surface | `[data-slot="composer-surface"]` | Input box with border |
| Composer fade | `[data-slot="composer-fade"]` | Fade transition wrapper |

## CSS Injection Pitfalls

1. **`backdrop-filter` requires semi-transparent background**: `background: transparent` + `backdrop-filter` = invisible. Use `rgba(0,0,0,0.25)` or similar.

2. **Sticky elements overlap**: `position: sticky` + transparent background overlaps content when scrolled. Add `.sticky { background-color: rgba(0,0,0,0.6) !important; }`

3. **Recursive `*` selectors**: `[data-role="user"] *` affects ALL nested elements (code blocks, buttons). Prefer `[data-role="user"] > div` for immediate children.

4. **No z-index needed for fixed background**: Insert as `body.firstChild` and skip `z-index`. Setting `z-index: -1` can put background behind the page entirely.
