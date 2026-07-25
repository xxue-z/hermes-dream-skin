# Hermes Dream Skin 主题格式参考

本文件供 `hermes-theme-generator` 技能在生成主题时查阅。主题是 `themes/<id>/theme.json`，
由插件在启动时通过磁盘 IPC 扫描发现，或在面板点「重新扫描(Rescan)」后加载。

## theme.json 顶层结构

```jsonc
{
  "schemaVersion": 1,            // 固定 1
  "id": "theme-1700000000000",   // 唯一标识，建议 theme-<时间戳>
  "name": "显示名",
  "description": "简述",
  "appearance": "auto",          // auto | light | dark（调色板以暗色氛围为主）
  "art": {
    "focusX": 0.5,               // 背景图焦点 X (0–1)
    "focusY": 0.35,              // 背景图焦点 Y (0–1)
    "safeArea": "center",        // left | right | center | none
    "taskMode": "ambient"         // ambient | banner | off
  },
  "image": "background.jpg",     // 背景图文件名（放同目录）；无图则 null
  "styles": { ... }              // 见下
}
```

## styles 结构

```jsonc
{
  "global": {
    "font":   { "family": "…", "size": 14, "color": "#edf0f1" },
    "background": {
      "gradient": false,          // 是否启用渐变（用 colors 多色数组）
      "glass": true,              // 玻璃蒙板
      "colors": ["#191c22db"],    // 背景色（支持 #RRGGBBAA）；渐变时为多色
      "gradientOpacity": 100,     // 渐变整体透明度 (0–100)
      "layerOpacity": 100,        // 整层 chrome 容器透明度 (0–100)
      "frost": 14                 // 磨砂模糊半径 px (0–40)
    },
    "border": { "color": "#8298a3", "width": 0, "radius": 0 }
  },
  "areas": {
    "topBar":      { "enabled": false, "font": {}, "background": {}, "border": {} },
    "leftSidebar": { "enabled": false, "font": {}, "background": {}, "border": {} },
    "chatArea":    { "enabled": false, "font": {}, "background": {}, "border": {} },
    "bottomBar":   { "enabled": false, "font": {}, "background": {}, "border": {} }
  },
  "customCSS": ":root{ … --ds-* 调色板 … }"
}
```

- `customCSS` 由插件作为**最后一块**注入（优先级最高），应是一个完整的 `:root{...}` 调色板。
- `areas` 各分区默认 `enabled:false`；如需单独覆盖某区域再开启并填 font/background/border。

## --ds-* 调色板变量（customCSS 必填项）

结构对齐 `src/style-config.js` 的 `DEFAULT_PALETTE_CSS`。四档色调别名：
`--ds-green`=主强调、`--ds-lime`=强调亮、`--ds-cyan`=次色、`--ds-purple`=高亮。

```
--ds-bg          背景基色（实心，无 alpha）
--ds-panel       面板色（比 bg 略亮）
--ds-panel-2     二级面板色（更亮）
--ds-green       主强调色
--ds-lime        强调亮色
--ds-cyan        次色
--ds-purple      高亮色
--ds-text        主文字色
--ds-muted       次级/弱化文字色
--ds-line        分隔线（rgba(accent,.24)）
--ds-bg-rgb / --ds-panel-rgb / --ds-panel-2-rgb / --ds-text-rgb / --ds-muted-rgb
--ds-accent-rgb / --ds-secondary-rgb / --ds-highlight-rgb    （"r g b" 空格分隔）
--ds-accent / --ds-accent-soft / --ds-secondary / --ds-highlight
--ds-on-accent   强调色上的文字色（按 accent 亮度选深/浅）
--ds-hero-scrim / --ds-task-shade / --ds-task-fade / --ds-immersive-*   渐变遮罩
```

> 生成器脚本 `scripts/generate-theme.mjs` 已内置上述全部变量的派生逻辑，
> 只需提供 `bg` / `accent` / `text` 三项（其余自动派生），无需手写。

## 关键规则

1. **暗色优先**：`color-scheme:dark`，调色板以暗底亮字为基调。
2. **背景图**：放入 `themes/<id>/` 同目录，`image` 填文件名；插件也会自动探测目录内图片。
3. **无背景图**：把 `image` 设 `null`，用 `background.colors`（纯色或渐变）+ `glass` 蒙板。
4. **结构化优先**：带 `styles` 的主题走 `generateStructuredCSS`，`customCSS` 作为最后一块注入；
   不带 `styles` 的旧主题走 legacy 路径（仅背景图 + 半透明遮罩），不要混用。
5. **变量引用**：渐变遮罩一律用 `rgb(var(--ds-*-rgb)/a)`，随基础变量自动重算，勿写死颜色。
