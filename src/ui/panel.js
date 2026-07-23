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

const { Button, Input, ScrollArea } = window.__HERMES_PLUGIN_SDK__

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
  // 保存 StyleEditor 当前草稿，供顶部"保持"按钮读取
  const draftRef = React.useRef(null)

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

  // 保存新增主题
  const handleSaveNewTheme = async (styles) => {
    if (!selectedFile || !newThemeName.trim()) {
      alert('Please enter a theme name and select an image')
      return
    }

    try {
      const theme = await themeManager.createThemeFromImage(selectedFile, {
        name: newThemeName.trim()
      })

      // 如果有自定义样式，保存
      if (styles) {
        themeManager.updateThemeStyles(theme.id, styles)
      }

      // 自动切换到新主题
      themeManager.setActiveTheme(theme.id)
      cssInjector.applyTheme(theme)

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

    themeManager.updateThemeStyles(editingTheme.id, styles)

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
    }

    setEditingTheme(null)
    setEditFile(null)
    setView('list')
    refreshThemes()
  }

  // 删除主题
  const handleRemoveTheme = (themeId) => {
    if (!confirm('Are you sure you want to delete this theme?')) {
      return
    }

    themeManager.removeTheme(themeId)
    refreshThemes()
  }

  return React.createElement('div', { className: 'p-4 space-y-4' },
    // 标题（列表视图显示）
    view === 'list' && React.createElement('h2', { className: 'text-lg font-semibold' }, 'Dream Skin'),

    // 列表视图
    view === 'list' && React.createElement(React.Fragment, null,
      // 添加主题按钮
      React.createElement(Button, {
        onClick: handleStartAdd,
        className: 'w-full'
      }, 'Add Theme'),

      // 主题列表
      React.createElement(ScrollArea, { className: 'h-[calc(100vh-180px)]' },
        React.createElement('div', { className: 'space-y-2' },
          themes.length === 0
            ? React.createElement('p', { className: 'text-sm text-gray-500 text-center py-8' },
                'No themes yet. Click "Add Theme" to get started.'
              )
            : themes.map(theme =>
                React.createElement(ThemeCard, {
                  key: theme.id,
                  theme,
                  isActive: activeTheme?.id === theme.id,
                  onSwitch: () => handleSwitchTheme(theme.id),
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
            className: 'px-3 py-1.5 rounded border border-(--ui-accent) bg-(--ui-accent) text-white hover:opacity-90 text-sm'
          }, '保持'),
          React.createElement('button', {
            onClick: () => { setNewThemeName(''); setSelectedFile(null); setView('list') },
            className: 'px-3 py-1.5 rounded border border-(--ui-stroke-secondary) text-(--ui-text-secondary) hover:bg-(--chrome-action-hover) text-sm'
          }, '取消')
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
            className: 'px-3 py-1.5 rounded border border-(--ui-accent) bg-(--ui-accent) text-white hover:opacity-90 text-sm'
          }, '保持'),
          React.createElement('button', {
            onClick: () => { setView('list'); setEditingTheme(null); setEditFile(null) },
            className: 'px-3 py-1.5 rounded border border-(--ui-stroke-secondary) text-(--ui-text-secondary) hover:bg-(--chrome-action-hover) text-sm'
          }, '取消')
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
            alt: '背景预览',
            className: 'w-full h-32 object-cover rounded-lg pointer-events-none'
          })
        : React.createElement(React.Fragment, null,
            React.createElement('div', { className: 'text-3xl text-gray-400' }, '⬆'),
            React.createElement('div', { className: 'text-sm text-gray-600' }, '拖放图片到此处，或点击选择'),
            React.createElement('div', { className: 'text-xs text-gray-400' }, '推荐 2560×1440 或更高')
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
 * 选中态以边框颜色区分，不显示"Active"文本
 */
function ThemeCard({ theme, isActive, onSwitch, onRemove, onEdit }) {
  // 激活主题禁止修改/删除：编辑与删除按钮禁用
  const actionBase = 'px-1.5 py-0.5 rounded border transition-colors'
  const actionEnabled = 'text-(--ui-text-tertiary) border-(--ui-stroke-secondary)'
  const actionDisabled = 'opacity-50 cursor-not-allowed text-(--ui-text-tertiary) border-(--ui-stroke-secondary)'

  return React.createElement('div', {
    className: `relative p-3 rounded-lg border-2 cursor-pointer transition-all ${
      isActive ? 'border-(--ui-accent)' : 'border-(--ui-stroke-secondary) hover:border-(--ui-text-tertiary)'
    }`,
    onClick: onSwitch,
    title: isActive ? '当前激活主题（不可编辑/删除）' : '点击应用此主题'
  },
    // 顶部：主题名 + 文字操作按钮
    React.createElement('div', { className: 'flex items-center justify-between mb-2' },
      React.createElement('h3', { className: 'font-medium text-sm' }, theme.name),
      React.createElement('div', { className: 'flex gap-1' },
        // 编辑按钮
        React.createElement('button', {
          disabled: isActive,
          onClick: (e) => { e.stopPropagation(); if (!isActive) onEdit() },
          className: `${actionBase} ${isActive ? actionDisabled : actionEnabled + ' hover:text-(--ui-accent) hover:border-(--ui-accent)'}`,
          title: isActive ? '激活主题不可编辑' : 'Edit Styles'
        }, '✎'),
        // 删除按钮
        React.createElement('button', {
          disabled: isActive,
          onClick: (e) => { e.stopPropagation(); if (!isActive) onRemove() },
          className: `${actionBase} ${isActive ? actionDisabled : actionEnabled + ' hover:text-(--ui-text-primary) hover:border-(--ui-text-primary)'}`,
          title: isActive ? '激活主题不可删除' : 'Delete Theme'
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
