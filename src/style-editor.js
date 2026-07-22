/**
 * 样式编辑器组件
 *
 * 提供可视化样式编辑界面：
 * - 标签切换（全局/顶部栏/左侧栏/聊天区/底部栏）
 * - 属性控制面板（颜色、范围滑块、文本输入）
 * - CSS 预览面板
 */

import { DEFAULT_STYLES, STYLE_METADATA } from './style-config.js'

const TABS = [
  { id: 'global', label: '全局' },
  { id: 'topBar', label: '顶部栏' },
  { id: 'leftSidebar', label: '左侧栏' },
  { id: 'chatArea', label: '聊天区' },
  { id: 'bottomBar', label: '底部栏' }
]

/**
 * 生成 CSS 预览字符串（简化版）
 */
function generatePreviewCSS(draftStyles) {
  if (!draftStyles) return ''

  const lines = []
  const { global, areas, customCSS } = draftStyles

  lines.push('html.dream-skin-active {')
  if (global?.font?.family) lines.push(`  font-family: '${global.font.family}';`)
  if (global?.font?.size) lines.push(`  font-size: ${global.font.size}px;`)
  if (global?.font?.color) lines.push(`  color: ${global.font.color};`)
  lines.push('}')

  lines.push('')
  lines.push('/* Global Background */')
  if (global?.background?.color) {
    const opacity = ((global.background.opacity ?? 80) / 100).toFixed(2)
    lines.push(`body { background-color: ${global.background.color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}; }`)
  }

  lines.push('')
  lines.push('/* Area Styles */')
  for (const [area, config] of Object.entries(areas || {})) {
    if (!config?.enabled) continue
    lines.push(`/* ${area} */`)
    lines.push(`[data-area="${area}"] {`)
    if (config.font?.color) lines.push(`  color: ${config.font.color};`)
    if (config.font?.size) lines.push(`  font-size: ${config.font.size}px;`)
    if (config.background?.color) lines.push(`  background-color: ${config.background.color};`)
    if (config.border?.color || config.border?.width !== undefined) {
      const color = config.border?.color || '#000'
      const width = config.border?.width ?? 0
      lines.push(`  border: ${width}px solid ${color};`)
    }
    if (config.border?.radius !== undefined) lines.push(`  border-radius: ${config.border.radius}px;`)
    lines.push('}')
  }

  if (customCSS?.trim()) {
    lines.push('')
    lines.push('/* Custom CSS */')
    lines.push(customCSS)
  }

  return lines.join('\n')
}

/**
 * 样式编辑器主组件
 *
 * @param {Object} props
 * @param {Object} [props.theme] - 编辑时的主题（可选）
 * @param {Function} props.onSave - 保存回调，接收 styles 参数
 * @param {Function} props.onCancel - 取消回调
 * @param {boolean} [props.isNew=false] - 是否为新建模式（顶部显示保存按钮）
 */
export function StyleEditor({ theme, onSave, onCancel, isNew = false }) {
  const [activeTab, setActiveTab] = React.useState('global')
  const [draftStyles, setDraftStyles] = React.useState(() =>
    JSON.parse(JSON.stringify(theme?.styles || DEFAULT_STYLES))
  )

  // 生成预览 CSS
  const previewCSS = React.useMemo(() => generatePreviewCSS(draftStyles), [draftStyles])

  const handleChange = React.useCallback((category, property, value, isArea = false) => {
    setDraftStyles(prev => {
      const next = JSON.parse(JSON.stringify(prev))
      if (isArea) {
        const area = activeTab
        if (!next.areas[area]) next.areas[area] = {}
        if (!next.areas[area][category]) next.areas[area][category] = {}
        next.areas[area][category][property] = value
      } else {
        if (!next.global[category]) next.global[category] = {}
        next.global[category][property] = value
      }
      return next
    })
  }, [activeTab])

  const handleToggleEnabled = React.useCallback(() => {
    setDraftStyles(prev => {
      const next = JSON.parse(JSON.stringify(prev))
      const area = activeTab
      if (!next.areas[area]) next.areas[area] = {}
      next.areas[area].enabled = !next.areas[area].enabled
      return next
    })
  }, [activeTab])

  return React.createElement('div', { className: 'space-y-4' },
    // 新建模式：顶部操作栏
    isNew && React.createElement('div', { className: 'flex items-center gap-2 pt-2 border-t' },
      React.createElement('button', {
        onClick: () => onSave(draftStyles),
        className: 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium'
      }, 'Save Theme'),
      React.createElement('button', {
        onClick: onCancel,
        className: 'px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm'
      }, 'Cancel')
    ),

    // 标签栏
    React.createElement('div', { className: 'flex gap-1 border-b pb-2 overflow-x-auto' },
      TABS.map(tab =>
        React.createElement('button', {
          key: tab.id,
          onClick: () => setActiveTab(tab.id),
          className: `px-3 py-1 text-sm rounded whitespace-nowrap ${
            activeTab === tab.id ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
          }`
        }, tab.label)
      )
    ),

    // 内容区
    React.createElement('div', { className: 'space-y-4' },
      React.createElement(TabContent, {
        tabId: activeTab,
        draftStyles,
        onChange: handleChange,
        onToggleEnabled: handleToggleEnabled
      }),

      // CSS 预览
      React.createElement(CSSPreview, { css: previewCSS })
    ),

    // 编辑模式：底部操作栏
    !isNew && React.createElement('div', { className: 'flex gap-2 pt-2 border-t' },
      React.createElement('button', {
        onClick: () => onSave(draftStyles),
        className: 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium'
      }, '保存'),
      React.createElement('button', {
        onClick: onCancel,
        className: 'px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm'
      }, '取消')
    )
  )
}

/**
 * 标签内容组件
 */
function TabContent({ tabId, draftStyles, onChange, onToggleEnabled }) {
  const isArea = tabId !== 'global'
  const config = isArea
    ? (draftStyles.areas[tabId] || {})
    : draftStyles.global

  const handlePropertyChange = (category, property, value) => {
    onChange(category, property, value, isArea)
  }

  return React.createElement('div', { className: 'space-y-4' },
    // 区域启用开关
    isArea && React.createElement('div', { className: 'flex items-center gap-2 p-3 bg-gray-50 rounded-lg' },
      React.createElement('input', {
        type: 'checkbox',
        id: 'enable-custom',
        checked: config.enabled || false,
        onChange: onToggleEnabled,
        className: 'w-4 h-4'
      }),
      React.createElement('label', { htmlFor: 'enable-custom', className: 'text-sm font-medium cursor-pointer' },
        '启用该区域自定义样式'
      )
    ),

    // 字体属性组
    React.createElement(PropertyGroup, {
      title: '字体',
      category: 'font',
      config: config.font || {},
      metadata: STYLE_METADATA.font,
      onChange: handlePropertyChange,
      disabled: isArea && !config.enabled
    }),

    // 背景属性组
    React.createElement(PropertyGroup, {
      title: '背景',
      category: 'background',
      config: config.background || {},
      metadata: STYLE_METADATA.background,
      onChange: handlePropertyChange,
      disabled: isArea && !config.enabled
    }),

    // 边框属性组
    React.createElement(PropertyGroup, {
      title: '边框',
      category: 'border',
      config: config.border || {},
      metadata: STYLE_METADATA.border,
      onChange: handlePropertyChange,
      disabled: isArea && !config.enabled
    })
  )
}

/**
 * 属性组组件
 */
function PropertyGroup({ title, category, config, metadata, onChange, disabled }) {
  return React.createElement('div', {
    className: `space-y-2 ${disabled ? 'opacity-50 pointer-events-none' : ''}`
  },
    React.createElement('h4', { className: 'font-medium text-sm text-gray-700 border-b pb-1' }, title),
    React.createElement('div', { className: 'space-y-3' },
      Object.entries(metadata).map(([key, meta]) => {
        const value = config[key] !== undefined ? config[key] : meta.default
        return React.createElement('div', { key, className: 'flex items-center gap-3' },
          React.createElement('label', { className: 'w-24 text-xs text-gray-500 flex-shrink-0' }, meta.label),
          meta.type === 'color' && React.createElement(ColorPicker, {
            value,
            meta,
            onChange: (val) => onChange(category, key, val)
          }),
          meta.type === 'range' && React.createElement('div', { className: 'flex items-center gap-2 flex-1' },
            React.createElement('input', {
              type: 'range',
              min: meta.min,
              max: meta.max,
              value,
              onChange: (e) => onChange(category, key, Number(e.target.value)),
              className: 'flex-1'
            }),
            React.createElement('span', { className: 'text-xs text-gray-500 w-12 text-right font-mono' },
              `${value}${meta.unit || ''}`
            )
          ),
          meta.type === 'text' && React.createElement('input', {
            type: 'text',
            value,
            onChange: (e) => onChange(category, key, e.target.value),
            className: 'flex-1 px-2 py-1 text-sm border rounded'
          })
        )
      })
    )
  )
}

/**
 * CSS 预览组件
 */
function CSSPreview({ css }) {
  return React.createElement('div', { className: 'space-y-2' },
    React.createElement('h4', { className: 'font-medium text-sm text-gray-700' }, 'CSS 预览'),
    React.createElement('textarea', {
      readOnly: true,
      value: css,
      className: 'w-full h-40 p-3 text-xs font-mono bg-gray-900 text-green-400 rounded resize-none',
      style: { fontFamily: 'monospace', fontSize: '11px' }
    })
  )
}

/**
 * 颜色选择器组件（支持透明度）
 */
function ColorPicker({ value, meta, onChange }) {
  const [localValue, setLocalValue] = React.useState(value || meta.default || '#ffffff')
  const [localOpacity, setLocalOpacity] = React.useState(100)
  
  React.useEffect(() => {
    setLocalValue(value || meta.default || '#ffffff')
  }, [value, meta.default])

  // 解析颜色值，获取 opacity
  React.useEffect(() => {
    if (typeof value === 'string' && value.length === 9 && value.startsWith('#')) {
      // #RRGGBBAA format
      const alphaHex = value.slice(7, 9)
      const alpha = parseInt(alphaHex, 16) / 255
      setLocalOpacity(Math.round(alpha * 100))
    }
  }, [value])

  const handleColorChange = (e) => {
    const newColor = e.target.value
    setLocalValue(newColor)
    if (meta.hasOpacity) {
      // Append alpha
      const alphaHex = Math.round((localOpacity / 100) * 255).toString(16).padStart(2, '0')
      onChange(newColor + alphaHex)
    } else {
      onChange(newColor)
    }
  }

  const handleOpacityChange = (e) => {
    const opacity = Number(e.target.value)
    setLocalOpacity(opacity)
    if (meta.hasOpacity) {
      const alphaHex = Math.round((opacity / 100) * 255).toString(16).padStart(2, '0')
      onChange(localValue + alphaHex)
    }
  }

  return React.createElement('div', { className: 'flex items-center gap-2 flex-1' },
    React.createElement('input', {
      type: 'color',
      value: localValue.slice(0, 7), // 只取 #RRGGBB
      onChange: handleColorChange,
      className: 'w-8 h-8 rounded border cursor-pointer'
    }),
    React.createElement('span', { className: 'text-xs text-gray-400 font-mono w-24' }, localValue),
    meta.hasOpacity && React.createElement('div', { className: 'flex items-center gap-1 flex-1' },
      React.createElement('input', {
        type: 'range',
        min: 0,
        max: 100,
        value: localOpacity,
        onChange: handleOpacityChange,
        className: 'w-20'
      }),
      React.createElement('span', { className: 'text-xs text-gray-500 w-10 text-right font-mono' }, localOpacity + '%')
    )
  )
}
