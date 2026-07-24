/**
 * UI 面板组件
 *
 * 提供主题管理界面：
 * - 主题列表（选中态以边框颜色区分）
 * - 添加主题（内联页面，含名称、背景图、样式编辑）
 * - 删除主题
 * - 样式编辑器（字体、颜色、背景、边框等可视化配置）
 */

import { StyleEditor } from '../style-editor.js'
import { DEFAULT_GLOBAL_CSS } from '../style-config.js'

const { Button, Input, ScrollArea } = window.__HERMES_PLUGIN_SDK__

// 统一按钮样式：固定底色 #9fb6e4 + 白字 + 12px（所有按钮一致）
// 注意：宿主 Tailwind 构建会剥离颜色工具类（如 bg-blue-600 / bg-[#...]），
// 因此底色必须用内联 style 设置，className 只负责形状/间距。
const BTN = 'rounded-lg px-3 py-1.5 font-medium whitespace-nowrap hover:opacity-90 transition-opacity'
const BTN_STYLE = { backgroundColor: '#9fb6e4', color: '#ffffff', fontSize: 12 }

// 内联 SVG 图标库（Feather 风格，stroke 跟随 currentColor；图标颜色由父按钮 / currentColor 决定，默认灰）
const ICON_DATA = {
  // 新增主题
  plus: [['line', { x1: 12, y1: 5, x2: 12, y2: 19 }], ['line', { x1: 5, y1: 12, x2: 19, y2: 12 }]],
  // 重新扫描
  refresh: [
    ['polyline', { points: '23 4 23 10 17 10' }],
    ['polyline', { points: '1 20 1 14 7 14' }],
    ['path', { d: 'M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15' }]
  ],
  // 恢复默认（逆时针回退箭头）
  rotateCcw: [
    ['polyline', { points: '1 4 1 10 7 10' }],
    ['path', { d: 'M3.51 15a9 9 0 1 0 2.13-9.36L1 10' }]
  ],
  // 全局规则（滑块 / 控制）
  sliders: [
    ['line', { x1: 4, y1: 21, x2: 4, y2: 14 }],
    ['line', { x1: 4, y1: 10, x2: 4, y2: 3 }],
    ['line', { x1: 12, y1: 21, x2: 12, y2: 12 }],
    ['line', { x1: 12, y1: 8, x2: 12, y2: 3 }],
    ['line', { x1: 20, y1: 21, x2: 20, y2: 16 }],
    ['line', { x1: 20, y1: 12, x2: 20, y2: 3 }],
    ['line', { x1: 1, y1: 14, x2: 7, y2: 14 }],
    ['line', { x1: 9, y1: 8, x2: 15, y2: 8 }],
    ['line', { x1: 17, y1: 16, x2: 23, y2: 16 }]
  ],
  // 选择文件夹
  folder: [['path', { d: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z' }]],
  // 取消（叉）
  x: [['line', { x1: 18, y1: 6, x2: 6, y2: 18 }], ['line', { x1: 6, y1: 6, x2: 18, y2: 18 }]],
  // 保留 / 确认（勾）
  check: [['polyline', { points: '20 6 9 17 4 12' }]],
  // 编辑（铅笔）
  edit: [['path', { d: 'M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z' }]],
  // 删除（垃圾桶）
  trash: [
    ['polyline', { points: '3 6 5 6 21 6' }],
    ['path', { d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' }],
    ['line', { x1: 10, y1: 11, x2: 10, y2: 17 }],
    ['line', { x1: 14, y1: 11, x2: 14, y2: 17 }]
  ]
}

function Icon({ name, size = 16 }) {
  const data = ICON_DATA[name] || []
  return React.createElement('svg', {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    focusable: false
  }, ...data.map(([tag, props]) => React.createElement(tag, props)))
}

/**
 * 图标按钮（纯图标）：默认透明背景、无边框、灰色图标；
 * 鼠标悬停时显示银灰色背景（--chrome-action-hover）+ 圆角边框（--ui-stroke-secondary）。
 * 用 React state 管理 hover，避免内联 style 覆盖 :hover 背景（内联优先级高于 class）。
 */
function IconButton({ name, title, ariaLabel, onClick, bordered = false, disabled = false }) {
  const [hover, setHover] = React.useState(false)
  const showBorder = bordered || hover
  return React.createElement('button', {
    type: 'button',
    onClick: disabled ? undefined : onClick,
    disabled,
    title,
    'aria-label': ariaLabel || title,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 4,
      borderRadius: 8,
      border: showBorder ? '1px solid var(--ui-stroke-secondary)' : '1px solid transparent',
      background: hover ? 'var(--chrome-action-hover)' : 'transparent',
      color: disabled ? 'var(--ui-text-quaternary)' : (hover ? '#000000' : '#919295'),
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      transition: 'background-color .15s ease, border-color .15s ease'
    }
  }, React.createElement(Icon, { name }))
}

export function createPanel({ themeManager, cssInjector }) {
  return React.createElement(DreamSkinPanel, { themeManager, cssInjector })
}

function DreamSkinPanel({ themeManager, cssInjector }) {
  const [themes, setThemes] = React.useState(() => themeManager.getAllThemes())
  const [activeTheme, setActiveTheme] = React.useState(() => themeManager.getActiveTheme())
  const [view, setView] = React.useState('list') // 'list' | 'add' | 'edit'
  const [editingTheme, setEditingTheme] = React.useState(null)

  // 新增主题状态
  const [newThemeName, setNewThemeName] = React.useState('')
  const [selectedFile, setSelectedFile] = React.useState(null)
  const [newStyles, setNewStyles] = React.useState(null)
  // 编辑视图中待保存的新背景图
  const [editFile, setEditFile] = React.useState(null)
  // 保存 StyleEditor 当前草稿，供顶部"Keep"按钮读取
  const draftRef = React.useRef(null)

  // 全局规则弹框状态
  const [showGlobalDialog, setShowGlobalDialog] = React.useState(false)
  const [globalDraft, setGlobalDraft] = React.useState('')

  // 主题目录（路径选择器）：默认指向插件安装目录下的 themes/
  const [themesDir, setThemesDir] = React.useState('')
  React.useEffect(() => {
    themeManager.getThemesDir().then(setThemesDir).catch(() => {})
  }, [themeManager])

  // 是否尚未设置有效的主题目录（渲染进程无法自动获取 userData，需用户在面板选择）
  const dirMissing = !themesDir || themesDir.includes('<user>')

  // 刷新主题列表
  const refreshThemes = React.useCallback(() => {
    setThemes(themeManager.getAllThemes())
    setActiveTheme(themeManager.getActiveTheme())
  }, [themeManager])

  // 监听主题变化
  React.useEffect(() => {
    themeManager.onThemeChange((theme) => {
      setActiveTheme(theme)
    })
  }, [themeManager])

  // 切换主题
  const handleSwitchTheme = (themeId) => {
    try {
      themeManager.setActiveTheme(themeId)
      const theme = themeManager.getActiveTheme()
      cssInjector.applyTheme(theme)
      // 确保全局规则（native 覆盖）随主题一并注入，Restore Defaults 后也能恢复完整外观
      cssInjector.applyGlobalCSS(themeManager.getGlobalRules())
    } catch (e) {
      console.error('[Dream Skin] Failed to switch theme:', e)
    }
  }

  // 开始添加主题
  const handleStartAdd = () => {
    setNewThemeName('')
    setSelectedFile(null)
    setNewStyles(null)
    setView('add')
  }

  // 保存新增主题（统一入口：始终落盘 themes/<名称>/theme.json）
  const handleSaveNewTheme = async (styles) => {
    const name = newThemeName.trim()
    if (!name) {
      alert('Please enter a theme name')
      return
    }
    try {
      const finalStyles = styles || draftRef.current || null
      const theme = await themeManager.createTheme({
        name,
        imageFile: selectedFile || null,
        styles: finalStyles
      })

      // 自动切换到新主题
      themeManager.setActiveTheme(theme.id)
      cssInjector.applyTheme(theme)
      cssInjector.applyGlobalCSS(themeManager.getGlobalRules())

      // 重置并返回列表
      setNewThemeName('')
      setSelectedFile(null)
      setNewStyles(null)
      setView('list')
      refreshThemes()
    } catch (e) {
      console.error('[Dream Skin] Failed to add theme:', e)
      alert(`Failed to add theme: ${e.message}`)
    }
  }

  // 开始编辑主题
  const handleStartEdit = (theme) => {
    setEditingTheme(theme)
    setEditFile(null)
    setView('edit')
  }

  // 保存编辑的主题
  const handleSaveEdit = async (styles) => {
    if (!editingTheme) return

    await themeManager.updateThemeStyles(editingTheme.id, styles)

    // 若更换了背景图，一并保存
    if (editFile) {
      try {
        await themeManager.updateThemeImage(editingTheme.id, editFile)
      } catch (e) {
        console.error('[Dream Skin] Failed to update theme image:', e)
      }
    }

    // 如果是当前激活的主题，重新应用
    const active = themeManager.getActiveTheme()
    if (active?.id === editingTheme.id) {
      cssInjector.applyTheme(active)
      cssInjector.applyGlobalCSS(themeManager.getGlobalRules())
    }

    setEditingTheme(null)
    setEditFile(null)
    setView('list')
    refreshThemes()
  }

  // 选择主题目录（宿主原生文件夹选择器）
  const handlePickThemesDir = async () => {
    try {
      const hd = window.hermesDesktop
      if (!hd || typeof hd.selectPaths !== 'function') {
        alert('Current host does not support folder selection')
        return
      }
      // hermesDesktop.selectPaths 真实签名：
      //   selectPaths(options?: { title?, defaultPath?, directories?: boolean, multiple?, filters? }) => Promise<string[]>
      // 选目录必须传 directories: true；返回 string[]（绝对路径数组）。
      const res = await hd.selectPaths({ title: '选择主题目录', directories: true })
      const picked = Array.isArray(res) ? res[0] : (typeof res === 'string' ? res : null)
      if (!picked) return
      themeManager.setThemesDir(picked)
      setThemesDir(picked)
      await handleRescan()
    } catch (e) {
      console.error('[Dream Skin] pick themes dir failed', e)
      alert(`Failed to select folder: ${e.message}`)
    }
  }

  // Rescan：仅重新扫描主题目录（从磁盘发现新增/删除的主题文件夹），
  // 保留当前激活主题与全局规则，不刷新页面、不动任何 storage 与磁盘文件。
  const handleRescan = async () => {
    try {
      const dir = await themeManager.getThemesDir()
      if (!dir) {
        alert('Please set the themes folder first — use the folder button in the "Themes Folder" card above, pointing to the themes/ folder under the plugin install directory')
        return
      }

      // 从磁盘重新扫描并重建主题列表（恢复存储中的激活态，不动全局规则）
      await themeManager.reloadFromStorage()
      themeManager.saveToStorage()

      // 重新套用当前激活主题（保持外观）；若激活主题已从磁盘移除则停用
      const active = themeManager.getActiveTheme()
      if (active) {
        cssInjector.applyTheme(active)
      } else {
        cssInjector.removeTheme()
      }

      refreshThemes()
    } catch (e) {
      console.error('[Dream Skin] rescan failed', e)
      alert(`Rescan failed: ${e.message}`)
    }
  }

  // 恢复 app 原生状态：停用主题 + 清所有 storage 缓存 + 刷新页面。
  // 注意：不删除磁盘文件，global-user.css 等仍保留，刷新后从磁盘原样加载。
  const handleRestoreDefaults = async () => {
    if (!confirm('Disable Dream Skin, clear all cached settings and reload? Your global rules file (global-user.css) is preserved on disk.')) {
      return
    }
    try {
      // 清所有 storage 缓存（主题、激活态、全局规则镜像、目录键），不动磁盘文件
      await themeManager.restoreSystemDefaults()
      // 立即移除已注入的主题样式与全局规则，给出原生外观的即时反馈
      cssInjector.removeTheme()
      cssInjector.removeGlobal()
      // 刷新页面 → boot 重新从磁盘扫描主题；全局规则从磁盘原样加载
      window.location.reload()
    } catch (e) {
      console.error('[Dream Skin] Failed to restore defaults:', e)
    }
  }

  // 删除主题
  const handleRemoveTheme = (themeId) => {
    if (!confirm('Are you sure you want to delete this theme?')) {
      return
    }

    themeManager.removeTheme(themeId)
    refreshThemes()
  }

  // 打开「全局规则」弹框：载入当前全局规则到草稿
  const handleOpenGlobal = () => {
    setGlobalDraft(themeManager.getGlobalRules())
    setShowGlobalDialog(true)
  }

  // 保存全局规则：写入用户全局规则文件（落盘），并即时重注入
  const handleSaveGlobal = async () => {
    try {
      await themeManager.setGlobalRules(globalDraft)
      cssInjector.applyGlobalCSS(globalDraft)
      setShowGlobalDialog(false)
    } catch (e) {
      console.error('[Dream Skin] Failed to save global rules:', e)
    }
  }

  // 全局规则重置为默认
  const handleResetGlobal = () => {
    setGlobalDraft(DEFAULT_GLOBAL_CSS)
  }

  return React.createElement('div', { className: 'p-4 space-y-4' },
    // 标题 + 操作按钮（同一行：标题在左，按钮在右）
    view === 'list' && React.createElement('div', { className: 'flex items-center justify-between mb-3' },
      React.createElement('h2', { className: 'text-lg font-semibold' }, 'Dream Skin'),
      React.createElement('div', { className: 'flex items-center gap-2' },
        React.createElement(IconButton, {
          name: 'plus', onClick: handleStartAdd,
          title: 'Add Theme', 'aria-label': 'Add Theme'
        }),
        React.createElement(IconButton, {
          name: 'refresh', onClick: handleRescan,
          title: 'Rescan the themes folder for new/removed themes (keeps your current theme and global rules)',
          'aria-label': 'Rescan'
        }),
        React.createElement(IconButton, {
          name: 'rotateCcw', onClick: handleRestoreDefaults,
          title: 'Restore Defaults — disable Dream Skin, clear cached settings and reload (global-user.css is preserved)',
          'aria-label': 'Restore Defaults'
        }),
        React.createElement(IconButton, {
          name: 'sliders', onClick: handleOpenGlobal,
          title: 'Global Rules — view and edit rules applied on plugin startup (shared across all themes)',
          'aria-label': 'Global Rules'
        })
      )
    ),

    // 全局规则弹框（模态）：查看 / 修改
    showGlobalDialog && React.createElement('div', {
      style: {
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,.55)', padding: 16
      },
      onClick: (e) => { if (e.target === e.currentTarget) setShowGlobalDialog(false) }
    },
      React.createElement('div', {
        style: {
          width: 'min(720px, 94vw)', maxHeight: '86vh',
          display: 'flex', flexDirection: 'column',
          background: 'var(--ds-panel, #191c22)', color: 'var(--ds-text, #edf0f1)',
          border: '1px solid var(--ds-line, rgba(130,152,163,.24))',
          borderRadius: 14, boxShadow: '0 24px 64px rgba(0,0,0,.5)', overflow: 'hidden'
        }
      },
        // 标题栏
        React.createElement('div', {
          style: {
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 18px', borderBottom: '1px solid var(--ds-line, rgba(130,152,163,.24))'
          }
        },
          React.createElement('h3', { style: { fontSize: 16, fontWeight: 600 } }, 'Global Rules'),
          React.createElement('button', {
            onClick: () => setShowGlobalDialog(false),
            title: 'Close',
            style: {
              width: 30, height: 30, borderRadius: 8, border: '1px solid transparent',
              background: 'transparent', color: 'var(--ds-muted, #a3aaae)',
              cursor: 'pointer', fontSize: 18, lineHeight: 1
            }
          }, '×')
        ),
        // 说明 + 编辑区
        React.createElement('div', { style: { padding: '16px 18px', flex: 1, overflow: 'auto' } },
          React.createElement('p', {
            style: { fontSize: 12, color: 'var(--ds-muted, #a3aaae)', marginBottom: 10, lineHeight: 1.5 }
          }, 'These rules are applied on plugin startup and require a theme to be active. They are shared across all themes and saved to a file (global-user.css under the plugin folder), so they survive a Rescan. Reset restores the built-in default.'),
          React.createElement('textarea', {
            value: globalDraft,
            onChange: (e) => setGlobalDraft(e.target.value),
            spellCheck: false,
            style: {
              width: '100%', height: '46vh', resize: 'none',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 12, lineHeight: 1.55, color: '#9ae6b4', background: '#0c0f14',
              border: '1px solid var(--ds-line, rgba(130,152,163,.24))',
              borderRadius: 8, padding: 12
            }
          })
        ),
        // 底部按钮
        React.createElement('div', {
          style: {
            display: 'flex', gap: 8, justifyContent: 'flex-end',
            padding: '12px 18px', borderTop: '1px solid var(--ds-line, rgba(130,152,163,.24))'
          }
        },
          React.createElement(Button, {
            onClick: handleResetGlobal, className: BTN, style: BTN_STYLE,
            title: 'Reset global rules to default'
          }, 'Reset'),
          React.createElement(IconButton, {
            name: 'x', onClick: () => setShowGlobalDialog(false),
            title: 'Cancel', 'aria-label': 'Cancel'
          }),
          React.createElement(Button, {
            onClick: handleSaveGlobal, className: BTN, style: BTN_STYLE
          }, 'Save')
        )
      )
    ),

    // 列表视图
    view === 'list' && React.createElement(React.Fragment, null,

      // 主题目录设置（运行时扫描，可改路径）
      React.createElement('div', {
        className: 'p-3 mb-3 rounded-lg border border-(--ui-stroke-secondary) space-y-2'
      },
        React.createElement('label', { className: 'block text-xs font-medium text-(--ui-text-secondary)' }, 'Themes Folder'),
        React.createElement('div', { className: 'flex items-center gap-2' },
          React.createElement(Input, {
            value: themesDir || '',
            onChange: (e) => setThemesDir(e.target.value),
            placeholder: 'C:/Users/<user>/AppData/Local/hermes/desktop-plugins/hermes-dream-skin/themes'
          }),
          React.createElement(IconButton, {
            name: 'folder', onClick: handlePickThemesDir,
            title: 'Select Folder', 'aria-label': 'Select Folder'
          })
        )
      ),

      // 主题列表
      React.createElement(ScrollArea, { className: 'h-[calc(100vh-280px)]' },
        React.createElement('div', { className: 'space-y-2' },
          themes.length === 0
            ? React.createElement('div', { className: 'text-sm text-(--ui-text-tertiary) text-center py-8 space-y-1' },
                dirMissing
                  ? React.createElement(React.Fragment, null,
                      React.createElement('p', null, '尚未设置主题目录。'),
                      React.createElement('p', null, '请先在上方「主题路径」选择 themes 文件夹，再点重新扫描按钮（刷新图标）。')
                    )
                  : React.createElement('p', null, 'No themes yet. Click the + (Add Theme) button to get started.')
              )
            : themes.map(theme =>
                React.createElement(ThemeCard, {
                  key: theme.id,
                  theme,
                  isActive: activeTheme?.id === theme.id,
                  onActivate: () => handleSwitchTheme(theme.id),
                  onRemove: () => handleRemoveTheme(theme.id),
                  onEdit: () => handleStartEdit(theme)
                })
              )
        )
      )
    ),

    // 添加主题视图
    view === 'add' && React.createElement(React.Fragment, null,
      // 顶部标题和按钮
      React.createElement('div', { className: 'flex items-center justify-between' },
        React.createElement('h2', { className: 'text-lg font-semibold' }, 'Add New Theme'),
        React.createElement('div', { className: 'flex items-center gap-2' },
          React.createElement(IconButton, {
            name: 'check', onClick: () => handleSaveNewTheme(draftRef.current),
            title: 'Keep', 'aria-label': 'Keep'
          }),
          React.createElement(IconButton, {
            name: 'x', onClick: () => { setNewThemeName(''); setSelectedFile(null); setView('list') },
            title: 'Cancel', 'aria-label': 'Cancel'
          })
        )
      ),

      // 主题名称
      React.createElement('div', null,
        React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Theme Name'),
        React.createElement(Input, {
          value: newThemeName,
          onChange: (e) => setNewThemeName(e.target.value),
          placeholder: 'e.g., Gothic Void'
        })
      ),

      // 背景图片（可拖入 + 点击选择）
      React.createElement(BackgroundImageField, {
        label: 'Background Image',
        onFile: setSelectedFile
      }),

      // 样式编辑器
      React.createElement(StyleEditor, {
        onSave: handleSaveNewTheme,
        onCancel: () => setView('list'),
        draftRef,
        isNew: true
      })
    ),

    // 编辑主题视图
    view === 'edit' && editingTheme && React.createElement(React.Fragment, null,
      // 顶部标题和按钮
      React.createElement('div', { className: 'flex items-center justify-between' },
        React.createElement('h2', { className: 'text-lg font-semibold' }, 'Edit Theme'),
        React.createElement('div', { className: 'flex items-center gap-2' },
          React.createElement(IconButton, {
            name: 'check', onClick: () => handleSaveEdit(draftRef.current),
            title: 'Keep', 'aria-label': 'Keep'
          }),
          React.createElement(IconButton, {
            name: 'x', onClick: () => { setView('list'); setEditingTheme(null); setEditFile(null) },
            title: 'Cancel', 'aria-label': 'Cancel'
          })
        )
      ),

      // 主题名称（只读）
      React.createElement('div', null,
        React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Theme Name'),
        React.createElement(Input, {
          value: editingTheme.name,
          disabled: true
        })
      ),

      // 背景图片（可拖入 + 点击选择，initialPreview 展示当前图）
      React.createElement(BackgroundImageField, {
        label: 'Background Image',
        initialPreview: editingTheme.image,
        onFile: setEditFile
      }),

      // 样式编辑器
      React.createElement(StyleEditor, {
        theme: editingTheme,
        onSave: handleSaveEdit,
        onCancel: () => { setView('list'); setEditingTheme(null); setEditFile(null) },
        draftRef,
        isNew: false
      })
    )
  )
}

/**
 * 背景图片选择区（可拖入 + 点击选择）
 *
 * 设计要点：整块区域本身就是一个 <label>，文件输入以 sr-only 形式内联，
 * 点击区域由浏览器原生打开文件对话框——不再依赖「隐藏的 <input> + 代码里调 .click()」
 * 那种看不见的按钮逻辑。拖拽放下同样走原生 drag 事件。
 */
const SR_ONLY = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
  border: 0
}

function BackgroundImageField({ label, initialPreview, onFile }) {
  const [preview, setPreview] = React.useState(initialPreview || null)
  const [isDrag, setIsDrag] = React.useState(false)
  const idRef = React.useRef('bg-input-' + Math.random().toString(36).slice(2))
  const inputId = idRef.current

  const handleFiles = React.useCallback((files) => {
    const file = files && files[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    onFile(file)
  }, [onFile])

  return React.createElement('div', { className: 'space-y-2' },
    React.createElement('label', { className: 'block text-sm font-medium' }, label),
    React.createElement('label', {
      htmlFor: inputId,
      className: `flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer text-center transition-colors ${isDrag ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`,
      onDragOver: (e) => { e.preventDefault(); setIsDrag(true) },
      onDragLeave: (e) => { e.preventDefault(); setIsDrag(false) },
      onDrop: (e) => { e.preventDefault(); setIsDrag(false); handleFiles(e.dataTransfer.files) }
    },
      preview
        ? React.createElement('img', {
            src: preview,
            alt: 'Background preview',
            className: 'w-full h-32 object-cover rounded-lg pointer-events-none'
          })
        : React.createElement(React.Fragment, null,
            React.createElement('div', { className: 'text-3xl text-gray-400' }, '⬆'),
            React.createElement('div', { className: 'text-sm text-gray-600' }, 'Drag an image here, or click to select'),
            React.createElement('div', { className: 'text-xs text-gray-400' }, 'Recommended 2560×1440 or higher')
          ),
      React.createElement('input', {
        id: inputId,
        type: 'file',
        accept: 'image/*',
        style: SR_ONLY,
        onChange: (e) => handleFiles(e.target.files)
      })
    )
  )
}

/**
 * 主题卡片组件
 * 选中态以边框颜色区分；列表上的按钮统一蓝色背景；「Activate」按钮点击后才正式应用主题。
 */
function ThemeCard({ theme, isActive, onActivate, onRemove, onEdit }) {
  return React.createElement('div', {
    className: `relative p-3 rounded-lg border-2 transition-all ${
      isActive ? 'border-(--ui-accent)' : 'border-(--ui-stroke-secondary) hover:border-(--ui-text-tertiary)'
    }`,
    title: isActive ? 'Active theme' : 'Use "Activate" to apply this theme'
  },
    // 顶部：主题名 + 操作按钮（图标按钮：默认仅边框无背景，hover 显银灰背景）
    React.createElement('div', { className: 'flex items-center justify-between mb-2' },
      React.createElement('h3', { className: 'font-medium text-sm' }, theme.name),
      React.createElement('div', { className: 'flex gap-1' },
        // 应用（激活）按钮
        React.createElement(IconButton, {
          name: 'check',
          bordered: true,
          disabled: isActive,
          onClick: (e) => { e.stopPropagation(); if (!isActive) onActivate() },
          title: isActive ? 'This theme is active' : 'Activate this theme',
          ariaLabel: isActive ? 'Active theme' : 'Activate this theme'
        }),
        // 编辑按钮
        React.createElement(IconButton, {
          name: 'edit',
          bordered: true,
          disabled: isActive,
          onClick: (e) => { e.stopPropagation(); if (!isActive) onEdit() },
          title: isActive ? 'Active theme cannot be edited' : 'Edit Styles',
          ariaLabel: isActive ? 'Cannot edit active theme' : 'Edit Styles'
        }),
        // 删除按钮
        React.createElement(IconButton, {
          name: 'trash',
          bordered: true,
          disabled: isActive,
          onClick: (e) => { e.stopPropagation(); if (!isActive) onRemove() },
          title: isActive ? 'Active theme cannot be deleted' : 'Delete Theme',
          ariaLabel: isActive ? 'Cannot delete active theme' : 'Delete Theme'
        })
      )
    ),
    // 底部：预览图
    theme.image && React.createElement('img', {
      src: theme.image,
      alt: theme.name,
      className: 'w-full h-20 object-cover rounded-md'
    })
  )
}
