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
    const color = global.background.color
    // 颜色已内嵌 alpha（#RRGGBBAA）时直接使用；否则叠加 background.opacity
    if (color.length >= 9) {
      lines.push(`body { background-color: ${color}; }`)
    } else {
      const opacity = ((global.background.opacity ?? 80) / 100).toFixed(2)
      lines.push(`body { background-color: ${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}; }`)
    }
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
export function StyleEditor({ theme, onSave, onCancel, draftRef, isNew = false }) {
  const [activeTab, setActiveTab] = React.useState('global')
  const [draftStyles, setDraftStyles] = React.useState(() =>
    JSON.parse(JSON.stringify(theme?.styles || DEFAULT_STYLES))
  )

  // 将最新草稿暴露给外层（供面板顶部"保持"按钮读取并保存）
  React.useEffect(() => {
    if (draftRef) draftRef.current = draftStyles
  }, [draftStyles, draftRef])

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

// ── 颜色选择器辅助函数（自包含，无任何外部 CDN / 第三方库依赖） ──

// 解析颜色值 -> { hex: '#RRGGBB', alpha: 0..1 }
function cpParseColor(value) {
  let hex = '#ffffff'
  let alpha = 1
  if (value && typeof value === 'string' && value[0] === '#') {
    let h = value.slice(1)
    if (h.length === 3 || h.length === 4) {
      // #RGB / #RGBA 简写展开
      h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2] + (h[3] || '')
    }
    if (h.length >= 8) {
      alpha = parseInt(h.slice(6, 8), 16) / 255
    }
    if (/^[0-9a-fA-F]{6}$/.test(h.slice(0, 6))) {
      hex = '#' + h.slice(0, 6)
    }
  }
  return { hex, alpha }
}

// 组合 hex + alpha -> '#RRGGBBAA'
function cpToHex8(hex, alpha) {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
  return `${hex}${a.toString(16).padStart(2, '0')}`
}

// 棋盘格背景（透明色通用指示图案，非主题色，固定中性灰）
function cpCheckerboard() {
  return {
    backgroundImage:
      'linear-gradient(45deg, #c8c8c8 25%, transparent 25%),' +
      'linear-gradient(-45deg, #c8c8c8 25%, transparent 25%),' +
      'linear-gradient(45deg, transparent 75%, #c8c8c8 75%),' +
      'linear-gradient(-45deg, transparent 75%, #c8c8c8 75%)',
    backgroundSize: '8px 8px',
    backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0'
  }
}

function cpPopoverStyle() {
  return {
    width: '280px',
    top: 'calc(100% + 4px)',
    left: '0',
    boxShadow: '0 4px 24px rgba(0,0,0,0.15), 0 0 1px rgba(0,0,0,0.1)',
    border: '1px solid rgba(0,0,0,0.08)'
  }
}

/**
 * 颜色选择器组件（自包含实现，无外部依赖）
 *
 * 同时支持：
 * - 颜色选择：原生 <input type="color">，跨平台一致的取色体验
 * - 透明度调整：meta.hasOpacity 为 true 时显示 Alpha 滑块，二者可在同一面板内同时调整
 *
 * 输出格式：hasOpacity 时返回 #RRGGBBAA，否则返回 #RRGGBB
 */
function ColorPicker({ value, meta, onChange }) {
  const hasOpacity = !!meta?.hasOpacity

  const parsed = React.useMemo(() => cpParseColor(value), [value])
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef(null)
  const justClickedRef = React.useRef(false)

  const finalValue = hasOpacity ? cpToHex8(parsed.hex, parsed.alpha) : parsed.hex

  const emit = React.useCallback((hex, alpha) => {
    onChange(hasOpacity ? cpToHex8(hex, alpha) : hex)
  }, [hasOpacity, onChange])

  // 手动输入 hex（支持 6 位 / 8 位），仅在合法时才提交，避免中途输入破坏状态
  const handleHexInput = (e) => {
    const v = e.target.value.trim()
    if (!/^#[0-9a-fA-F]{6}$/.test(v) && !/^#[0-9a-fA-F]{8}$/.test(v)) return
    const p = cpParseColor(v)
    emit(p.hex, hasOpacity ? p.alpha : 1)
  }

  // 点击外部关闭
  React.useEffect(() => {
    if (!isOpen) return
    const onDocDown = (e) => {
      if (justClickedRef.current) {
        justClickedRef.current = false
        return
      }
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocDown)
    return () => document.removeEventListener('mousedown', onDocDown)
  }, [isOpen])

  const handlePreviewClick = (e) => {
    e.stopPropagation()
    justClickedRef.current = true
    setIsOpen((prev) => !prev)
  }

  const alphaPct = Math.round(parsed.alpha * 100)

  return React.createElement('div', { className: 'relative flex items-center gap-3 flex-1' },
    // 预览按钮（棋盘格透明指示 + 颜色叠加）
    React.createElement('div', {
      className: 'w-8 h-8 rounded border overflow-hidden cursor-pointer flex-shrink-0 relative',
      onClick: handlePreviewClick,
      role: 'button',
      tabIndex: 0,
      'aria-label': '选择颜色'
    },
      React.createElement('div', { className: 'absolute inset-0', style: cpCheckerboard() }),
      React.createElement('div', {
        className: 'absolute inset-0',
        style: { backgroundColor: parsed.hex, opacity: hasOpacity ? parsed.alpha : 1 }
      })
    ),
    // 颜色值文本
    React.createElement('span', {
      className: 'text-xs text-gray-400 font-mono flex-shrink-0',
      style: { minWidth: '74px' }
    }, finalValue),

    // Popover
    isOpen && React.createElement('div', {
      ref: containerRef,
      className: 'absolute z-50 bg-white rounded-lg p-4 space-y-3',
      style: cpPopoverStyle()
    },
      // 颜色选择（原生拾色器）
      React.createElement('div', { className: 'flex items-center gap-2' },
        React.createElement('input', {
          type: 'color',
          value: parsed.hex,
          onChange: (e) => emit(e.target.value, hasOpacity ? parsed.alpha : 1),
          className: 'w-10 h-10 cursor-pointer bg-transparent border-0 p-0',
          'aria-label': '颜色'
        }),
        React.createElement('input', {
          type: 'text',
          value: finalValue,
          onChange: handleHexInput,
          spellCheck: false,
          className: 'flex-1 px-2 py-1 text-xs font-mono border rounded'
        })
      ),

      // 透明度滑块（仅 hasOpacity 时显示，与颜色选择同时存在）
      hasOpacity && React.createElement('div', { className: 'space-y-1' },
        React.createElement('div', { className: 'flex items-center justify-between text-xs text-gray-500' },
          React.createElement('span', null, '透明度'),
          React.createElement('span', { className: 'font-mono' }, `${alphaPct}%`)
        ),
        React.createElement('div', { className: 'flex items-center gap-2' },
          React.createElement('input', {
            type: 'range',
            min: 0,
            max: 100,
            step: 1,
            value: alphaPct,
            onChange: (e) => emit(parsed.hex, Number(e.target.value) / 100),
            className: 'flex-1'
          }),
          // 透明度预览条
          React.createElement('div', {
            className: 'w-6 h-6 rounded border overflow-hidden relative flex-shrink-0',
            style: cpCheckerboard()
          }, React.createElement('div', {
            className: 'absolute inset-0',
            style: { backgroundColor: parsed.hex, opacity: parsed.alpha }
          }))
        )
      ),

      // 确定按钮
      React.createElement('div', { className: 'flex justify-end pt-2 border-t' },
        React.createElement('button', {
          className: 'px-3 py-1.5 rounded border border-(--ui-accent) bg-(--ui-accent) text-white hover:opacity-90 text-xs',
          onClick: () => setIsOpen(false)
        }, '确定')
      )
    )
  )
}