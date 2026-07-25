---
name: hermes-theme-generator
description: >-
  为 Hermes Dream Skin 插件快速生成一套合规的主题（themes/<id>/theme.json）。
  当用户想"新建/做一个/生成一个 Hermes 主题""换个皮肤配色""用某张背景图做个主题"
  或提供背景图+配色+字体要求时触发。技能会引导依次收集：背景图（单选项：
  是 / 输入图片地址 / 否）、主配色方案（背景/强调色/文字色）、字体（颜色/大小/
  字体族），然后调用生成器脚本按插件规则产出 theme.json 并提示如何加载。
---

# Hermes Dream Skin 主题生成器

把"用户的一句话需求"变成插件可直接加载的主题文件夹。重点不是手写 CSS，
而是按插件规则（`src/style-config.js` 的 `--ds-*` 调色板 + 结构化 `styles`）产出合规文件。

## 何时使用

- 用户说"帮我做个主题""生成一个 Hermes 皮肤""用这张图做个主题"。
- 用户给出配色/背景图/字体要求，想快速套用。
- 用户想在预设之外新增自定义主题。

## 信息收集（核心 3 问）

**必须收集以下 3 类信息**后再生成。推荐用 `AskUserQuestion` 一次性问离散项，
自由文本项（背景图路径、字体族）用自然语言追问或在同一轮里让用户用 "Other" 填写。
**关键：普通用户不懂 hex，配色绝对不要直接问颜色代码**（见第 2 问的三种兜底）。

1. **背景图**（单选项，合并"是否有图"与"图片地址"为一问）
   - 用 `AskUserQuestion` 抛 **单选项**（`multiSelect:false`），选项：
     - `否` — 不使用背景图，主题走 `background.colors` 纯色/渐变。
     - `是` — 我有一张背景图；选此项后**追问**完整路径/URL（自由文本），
       如 `C:/Users/xxx/Pictures/bg.jpg`（支持 jpg/png/webp）。
     - `输入图片地址` — 直接给出图片地址；用户可在该问题的 **"Other" 自由文本框**
       里粘贴路径，或选此项后再追问一次地址。
   - 规则：选 `否` → spec 不传 `backgroundImage`、`image:null`；
     选 `是`/`输入图片地址` → 拿到地址后写入 spec 的 `backgroundImage` 字段，
     生成器会自动复制图片进 `themes/<id>/` 并把 `image` 设为文件名。
   - 若用户说"放在主题文件夹里自动探测"，可不传地址，生成后再把图丢进 `themes/<id>/`。

2. **主要配色方案**（不要求用户懂 hex，关键）
   用户几乎不可能知道颜色代码，所以**不要直接问 hex**。用以下三种方式兜底，
   按优先级推荐：(a) 预设配色卡 → (b) 教用户一键取色 → (c) 按描述生成。
   - **(a) 预设配色卡（最推荐）**：用 `AskUserQuestion` 抛单选项。色卡数据见
     **`references/palettes.json`**（共 5 套，唯一数据源，默认 `tech-deep-blue`）——把每套的
     `name` + `mood` + 示例 hex 作为选项标签，用户按感觉选即可（hex 仅作透明展示，不要求记忆）。
     选完即得到"背景基色 + 主强调色"两档（`text` 也一并带入）；**文字色**若用户另有要求可覆盖
     （暗色默认近白 `#edf0f1`，浅色默认深灰 `#1a1a1a`）。
   - **(b) 教用户快速取到任意颜色代码**（当用户想用自己的图/品牌色时）：
     - Windows：装 **PowerToys** → `Win+Shift+C` 屏幕取色，自动复制 hex 到剪贴板。
     - 浏览器：F12 → 元素面板点取色器图标（吸管）→ 点屏幕上任意像素读取 hex。
     - macOS：自带「数码测色计 / Digital Color Meter」。
     - 截图法：把图片/截图丢进本对话，让 AI 直接读主色 hex（见下方 c）。
   - **(c) 按描述生成**：用户只给形容词（如"清爽浅色、绿色强调""赛博朋克紫粉"），
     **由你（AI）把描述映射成 hex** 再写进 spec——**不要反问"hex 是多少"**。
     实在拿不准就回退到 (a) 的预设卡。
   - 顺带可问 `appearance`（auto/light/dark，默认 auto）与 `safeArea`/`taskMode`（不强制）。

3. **字体（颜色 / 大小 / 字体族）**（自由文本）
   - 字号默认 `14`px；字体颜色默认 = 上文文字色；字体族默认
     `"Segoe UI Variable Text", "Segoe UI", "Microsoft YaHei UI", system-ui, sans-serif`。
   - 用户只给"大一点/小一点"时映射到 16 / 12 等。

> 收集时尽量给出默认值与示例 hex，降低用户决策成本；缺项用上文默认补齐，不要卡住。

## 生成步骤

1. 把收集到的信息整理成一份 **spec JSON**（字段见 `references/theme-format.md`）。最小可用：
   ```jsonc
   {
     "name": "主题显示名",
     "description": "简述",
     "appearance": "auto",
     "backgroundImage": "C:/.../bg.jpg",   // 无图则删掉此行
     "palette": { "bg": "#111318", "accent": "#8298a3", "text": "#edf0f1" },
     "font": { "size": 14, "color": "#edf0f1" }
   }
   ```
2. 把 spec 写入临时文件（如 `theme-spec.json`），运行生成器：
   ```bash
   # 方式一：直接用预设色卡（推荐，用户无需提供 hex）
   node skill/scripts/generate-theme.mjs --palette tech-deep-blue --spec theme-spec.json
   #   --palette 不跟 id 则用 palettes.json 里的 default；色卡 colors 作为基础，
   #   spec.palette 中的字段可逐项覆盖（如只改 accent）。

   # 方式二：spec 自带 palette（手写 hex 或按描述生成的 hex）
   node skill/scripts/generate-theme.mjs --spec theme-spec.json

   # 通用：从 stdin 读取 / 指定 themes 目录
   cat theme-spec.json | node skill/scripts/generate-theme.mjs
   node skill/scripts/generate-theme.mjs --spec theme-spec.json --themes-dir <dir>
   ```
   > **推荐走 `--palette`**：第 2 问选中的色卡 id 直接传给 `--palette`，agent 不必再搬运 hex；
   > spec 里只填 name / 背景图 / 字体 / 想微调的个别颜色即可。
3. 脚本会：
   - 若给了 `--palette`，先从 `references/palettes.json` 读取该色卡的完整 `colors`
     （bg/panel/panel2/accent/accentAlt/secondary/highlight/text/muted/line）作为基础调色板。
   - 派生其余 `--ds-*` 变量（各 `-rgb` + 渐变遮罩），写出 `themes/<id>/theme.json`。
   - 若给了 `backgroundImage`，自动复制图片进 `themes/<id>/` 并把 `image` 设为文件名。
4. 校验输出路径与摘要（脚本已打印）。

## 加载到插件

主题写在项目 `themes/` 下后：

- **开发态**：`npm run build` → 复制 `plugin.js`（及 `themes/`）到
  `%LOCALAPPDATA%\hermes\desktop-plugins\hermes-dream-skin\` →
  在 Hermes 执行 **Reload desktop plugins**。
- **加载主题**：打开 Dream Skin 面板 → 若已设置主题目录则点 **Rescan（重新扫描）**；
  若列表为空先**选择文件夹**指向插件 `themes/` → 新主题出现 → 点卡片 **✓** 应用。

## 关键规则 / 坑

- **暗色优先**：`color-scheme:dark`，调色板暗底亮字。
- **customCSS 是最后注入块**（优先级最高），生成器已正确处理，不要手改顺序。
- **勿写死渐变颜色**：遮罩一律用 `rgb(var(--ds-*-rgb)/a)`，随基础变量重算。
- **结构化优先**：带 `styles` 的主题走 `generateStructuredCSS`；不要产出无 `styles` 的 legacy 主题。
- **背景图放同目录**并填 `image` 文件名；无图则 `image:null` + 用 `background.colors`。
- **面板 UI 自身**有"禁止硬编码颜色"约定，但**主题 customCSS 用自有 `--ds-*` 变量，不受此限**。

## 参考

- `references/theme-format.md`：完整 schema 与 `--ds-*` 变量说明。
- `references/palettes.json`：预设配色卡唯一数据源（5 套，含默认），第 2 问色卡从此读取。
- `scripts/generate-theme.mjs`：调色板派生 + 文件生成实现（可改默认值或扩展字段）。
- 插件源码：`src/style-config.js`（DEFAULT_PALETTE_CSS / DEFAULT_STYLES）、`src/css-injector.js`（结构化生成）。
