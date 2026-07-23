# React Hooks in Hermes Desktop Plugins

## Problem

Hermes Desktop loads plugins as ES modules (strict mode). When you write:

```javascript
const { useState, useEffect } = React
```

Two problems occur after bundling multiple modules into a single `plugin.js`:

1. **Duplicate declarations**: When `plugin.js` is evaluated as a single module scope, if two source files both contain `const { useState } = React`, the second one throws `SyntaxError: Identifier 'useState' has already been declared`.

2. **Runtime `ReferenceError`**: Even with deduplication, `const { useState } = React` at module top-level can fail with `ReferenceError: React is not defined` if the module evaluates before `React` is bound in the Hermes Desktop environment.

## Root Cause

Hermes Desktop plugins run in ES module strict mode. `React` is not an imported module — it's injected by the host at some point during load. Module-level destructuring (`const { useState } = React`) tries to read `React` when the module is first parsed, which may be before `React` is defined.

Using `React.useState` defers the property access until the function is called, which is always after `React` is available.

## Solution

**Always use `React.useState`, `React.useEffect`, etc. Never destructure.**

### ✅ Correct (in every source module)

```javascript
function MyComponent() {
  const [count, setCount] = React.useState(0)
  const ref = React.useRef(null)
  React.useEffect(() => { /* ... */ }, [])
  // ...
}
```

### ❌ Incorrect (causes bundling/runtime errors)

```javascript
// DON'T DO THIS:
const { useState, useEffect } = React

function MyComponent() {
  const [count, setCount] = useState(0)  // Breaks after bundling
  // ...
}
```

## Build Script

Keep the build script simple — no hook deduplication needed:

```javascript
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')

  // Strip ESM imports/exports
  content = content.replace(/^import\s+.*?\s*from\s*['"][^'"]+['"];?\n?/gm, '')
  content = content.replace(/^import\s+['"][^'"]+['"];?\n?/gm, '')
  content = content.replace(/export\s*\{[^}]*\}\s*from\s*['"][^'"]+['"];?\n?/g, '')
  content = content.replace(/export\s+(class|function|const|let|var)\s+/g, '$1 ')
  content = content.replace(/export\s+default\s+/, 'const __DEFAULT_EXPORT__ = ')

  return content.trim()
}
```

## Verification

After building `plugin.js`:

```bash
# Should return 0 results (no destructuring)
grep "const { useState" plugin.js
grep "const { useEffect" plugin.js

# Should show many results (correct pattern)
grep "React\.useState" plugin.js
grep "React\.useEffect" plugin.js

# Should pass syntax check
node --check plugin.js
```
