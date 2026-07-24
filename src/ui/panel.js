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

  // 合并「重新扫描 + Reload」：以主题目录为单一数据源，重扫磁盘 + 重载 Storage + 重新应用当前主题。
  // 改路径、新增主题、或外部手动放入主题文件夹后，点此即可生效；选中文件夹后也会自动调用。
  const handleRescan = async () => {
    try {
      // 从管理器读取真实生效目录（避免依赖可能过期的前端 state 闭包）
      const dir = await themeManager.getThemesDir()
      if (!dir) {
        alert('Please click "Select Folder" in the Themes Folder card above, pointing to the themes/ folder under the plugin install directory')
        return
      }
      themeManager.setThemesDir(dir)
      setThemesDir(dir)
      await themeManager.reloadFromStorage()
      const active = themeManager.getActiveTheme()
      if (active) cssInjector.applyTheme(active)
      refreshThemes()
    } catch (e) {
      console.error('[Dream Skin] rescan/reload failed', e)
      alert(`重新加载失败: ${e.message}`)
    }
  }

  // 恢复 app 原生状态：停用 Dream Skin，移除所有注入样式，回到 app 原生外观
  const handleRestoreDefaults = async () => {
    if (!confirm('Disable Dream Skin and restore the app to its native appearance? This turns off all themes.')) {
      return
    }
    try {
      await themeManager.restoreSystemDefaults()
      // 立即移除已注入的主题样式与全局规则，恢复原生外观（不再套用任何主题）
      cssInjector.removeTheme()
      cssInjector.removeGlobal()
      setView('list')
      refreshThemes()
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

  // 保存全局规则：持久化并即时重注入
  const handleSaveGlobal = () => {
    try {
      themeManager.setGlobalRules(globalDraft)
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
        React.createElement(Button, {
          onClick: handleStartAdd,
          className: BTN,
          style: BTN_STYLE
        }, 'Add Theme'),
        React.createElement(Button, {
          onClick: handleRescan,
          className: BTN,
          style: BTN_STYLE,
          title: 'Rescan themes folder and reload (merged Reload)'
        }, 'Rescan'),
        React.createElement(Button, {
          onClick: handleRestoreDefaults,
          className: BTN,
          style: BTN_STYLE,
          title: 'Disable Dream Skin and restore the app to its native appearance'
        }, 'Restore Defaults'),
        React.createElement(Button, {
          onClick: handleOpenGlobal,
          className: BTN,
          style: BTN_STYLE,
          title: 'View and edit global rules applied on plugin startup (shared across all themes)'
        }, 'Global Rules')
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
          }, 'These rules are applied on plugin startup and require a theme to be active. They are shared across all themes and are not stored per-theme.'),
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
          React.createElement(Button, {
            onClick: () => setShowGlobalDialog(false), className: BTN, style: BTN_STYLE
          }, 'Cancel'),
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
          React.createElement(Button, {
            onClick: handlePickThemesDir,
            className: BTN,
            style: BTN_STYLE
          }, 'Select Folder')
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
                      React.createElement('p', null, '请先在上方「主题路径」选择 themes 文件夹，再点「重新扫描」。')
                    )
                  : React.createElement('p', null, 'No themes yet. Click "Add Theme" to get started.')
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
          React.createElement('button', {
            onClick: () => handleSaveNewTheme(draftRef.current),
            className: 'px-3 py-1.5 rounded hover:opacity-90 text-sm',
            style: { backgroundColor: '#9fb6e4', color: '#ffffff', fontSize: 12 }
          }, 'Keep'),
          React.createElement('button', {
            onClick: () => { setNewThemeName(''); setSelectedFile(null); setView('list') },
            className: 'px-3 py-1.5 rounded hover:opacity-90 text-sm',
            style: { backgroundColor: '#9fb6e4', color: '#ffffff', fontSize: 12 }
          }, 'Cancel')
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
          React.createElement('button', {
            onClick: () => handleSaveEdit(draftRef.current),
            className: 'px-3 py-1.5 rounded hover:opacity-90 text-sm',
            style: { backgroundColor: '#9fb6e4', color: '#ffffff', fontSize: 12 }
          }, 'Keep'),
          React.createElement('button', {
            onClick: () => { setView('list'); setEditingTheme(null); setEditFile(null) },
            className: 'px-3 py-1.5 rounded hover:opacity-90 text-sm',
            style: { backgroundColor: '#9fb6e4', color: '#ffffff', fontSize: 12 }
          }, 'Cancel')
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
  // 列表按钮统一蓝色背景（宿主主题变量 --ui-accent）
  const blueBtn = 'px-2 py-0.5 rounded text-xs transition-colors'
  const blueStyle = {
    background: 'var(--ui-accent)',
    border: '1px solid var(--ui-accent)',
    color: '#fff'
  }
  const blueStyleDisabled = { ...blueStyle, opacity: 0.5, cursor: 'not-allowed' }

  return React.createElement('div', {
    className: `relative p-3 rounded-lg border-2 transition-all ${
      isActive ? 'border-(--ui-accent)' : 'border-(--ui-stroke-secondary) hover:border-(--ui-text-tertiary)'
    }`,
    title: isActive ? 'Active theme' : 'Use "Activate" to apply this theme'
  },
    // 顶部：主题名 + 操作按钮（蓝色背景）
    React.createElement('div', { className: 'flex items-center justify-between mb-2' },
      React.createElement('h3', { className: 'font-medium text-sm' }, theme.name),
      React.createElement('div', { className: 'flex gap-1' },
        // 激活按钮（图标，点击才正式应用主题）
        React.createElement('button', {
          disabled: isActive,
          onClick: (e) => { e.stopPropagation(); if (!isActive) onActivate() },
          style: isActive ? blueStyleDisabled : blueStyle,
          className: blueBtn,
          title: isActive ? 'This theme is active' : 'Activate this theme'
        }, isActive ? '✓' : '✓'),
        // 编辑按钮
        React.createElement('button', {
          disabled: isActive,
          onClick: (e) => { e.stopPropagation(); if (!isActive) onEdit() },
          style: isActive ? blueStyleDisabled : blueStyle,
          className: blueBtn,
          title: isActive ? 'Active theme cannot be edited' : 'Edit Styles'
        }, '✎'),
        // 删除按钮
        React.createElement('button', {
          disabled: isActive,
          onClick: (e) => { e.stopPropagation(); if (!isActive) onRemove() },
          style: isActive ? blueStyleDisabled : blueStyle,
          className: blueBtn,
          title: isActive ? 'Active theme cannot be deleted' : 'Delete Theme'
        }, '×')
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
