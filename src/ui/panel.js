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
    setView('edit')
  }

  // 保存编辑的主题
  const handleSaveEdit = (styles) => {
    if (!editingTheme) return

    themeManager.updateThemeStyles(editingTheme.id, styles)

    // 如果是当前激活的主题，重新应用
    const active = themeManager.getActiveTheme()
    if (active?.id === editingTheme.id) {
      cssInjector.applyTheme(active)
    }

    setEditingTheme(null)
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

  // 处理文件选择
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
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
        React.createElement('button', {
          onClick: () => setView('list'),
          className: 'text-sm text-gray-500 hover:text-gray-700'
        }, '← Back')
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

      // 背景图片
      React.createElement('div', null,
        React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Background Image'),
        React.createElement('input', {
          type: 'file',
          accept: 'image/*',
          onChange: handleFileSelect,
          className: 'block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
        })
      ),

      // 预览
      selectedFile && React.createElement('div', null,
        React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Preview'),
        React.createElement('img', {
          src: URL.createObjectURL(selectedFile),
          alt: 'Preview',
          className: 'w-full h-32 object-cover rounded-lg'
        })
      ),

      // 样式编辑器
      React.createElement(StyleEditor, {
        onSave: handleSaveNewTheme,
        onCancel: () => setView('list'),
        isNew: true
      })
    ),

    // 编辑主题视图
    view === 'edit' && editingTheme && React.createElement(React.Fragment, null,
      // 顶部标题和按钮
      React.createElement('div', { className: 'flex items-center justify-between' },
        React.createElement('h2', { className: 'text-lg font-semibold' }, 'Edit Theme'),
        React.createElement('button', {
          onClick: () => { setView('list'); setEditingTheme(null) },
          className: 'text-sm text-gray-500 hover:text-gray-700'
        }, '← Back')
      ),

      // 主题名称（只读）
      React.createElement('div', null,
        React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Theme Name'),
        React.createElement(Input, {
          value: editingTheme.name,
          disabled: true
        })
      ),

      // 背景图片预览
      editingTheme.image && React.createElement('div', null,
        React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Background Image'),
        React.createElement('img', {
          src: editingTheme.image,
          alt: editingTheme.name,
          className: 'w-full h-32 object-cover rounded-lg'
        })
      ),

      // 样式编辑器
      React.createElement(StyleEditor, {
        theme: editingTheme,
        onSave: handleSaveEdit,
        onCancel: () => { setView('list'); setEditingTheme(null) },
        isNew: false
      })
    )
  )
}

/**
 * 主题卡片组件
 * 选中态以边框颜色区分，不显示"Active"文本
 */
function ThemeCard({ theme, isActive, onSwitch, onRemove, onEdit }) {
  return React.createElement('div', {
    className: `relative p-3 rounded-lg border-2 cursor-pointer transition-all ${
      isActive ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50/30' : 'border-gray-200 hover:border-gray-400'
    }`,
    onClick: onSwitch
  },
    // 预览图
    theme.image && React.createElement('img', {
      src: theme.image,
      alt: theme.name,
      className: 'w-full h-20 object-cover rounded-md mb-2'
    }),
    // 主题信息
    React.createElement('div', { className: 'flex items-center justify-between' },
      React.createElement('div', null,
        React.createElement('h3', { className: 'font-medium text-sm' }, theme.name)
      ),
      // 操作按钮
      React.createElement('div', { className: 'flex gap-1' },
        // 编辑按钮
        React.createElement('button', {
          onClick: (e) => { e.stopPropagation(); onEdit() },
          className: 'text-gray-400 hover:text-blue-500 transition-colors px-1',
          title: 'Edit Styles'
        }, '✎'),
        // 删除按钮
        React.createElement('button', {
          onClick: (e) => { e.stopPropagation(); onRemove() },
          className: 'text-gray-400 hover:text-red-500 transition-colors px-1',
          title: 'Delete Theme'
        }, '×')
      )
    )
  )
}
