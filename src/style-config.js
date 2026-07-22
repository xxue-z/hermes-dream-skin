/**
 * 样式配置模块
 *
 * 定义区域选择器映射、默认样式结构和 UI 元数据
 */

/** 区域到 DOM 选择器的映射 */
export const AREA_SELECTORS = {
  topBar: '[data-slot="statusbar"], div[class*="h-[34px]"]',
  leftSidebar: '[data-tree-group="grp-sessions"]',
  chatArea: '[data-slot="composer-bounds"]',
  bottomBar: '[data-slot="statusbar"]'
}

/** 默认样式结构 */
export const DEFAULT_STYLES = {
  global: {
    font: { family: 'system-ui', size: 14, color: '#ffffff' },
    background: { color: '#000000', opacity: 80 },
    border: { color: '#333333', width: 1, radius: 8 }
  },
  areas: {
    topBar: { enabled: false, font: {}, background: {}, border: {} },
    leftSidebar: { enabled: false, font: {}, background: {}, border: {} },
    chatArea: { enabled: false, font: {}, background: {}, border: {} },
    bottomBar: { enabled: false, font: {}, background: {}, border: {} }
  },
  customCSS: ''
}

/** 样式属性的 UI 元数据 */
export const STYLE_METADATA = {
  font: {
    family: { label: 'Font Family', type: 'text', default: 'system-ui' },
    size: { label: 'Font Size', type: 'range', min: 10, max: 24, unit: 'px', default: 14 },
    color: { label: 'Font Color', type: 'color', default: '#ffffff' }
  },
  background: {
    color: { label: 'Background Color', type: 'color', default: '#000000' },
    opacity: { label: 'Opacity', type: 'range', min: 0, max: 100, unit: '%', default: 80 }
  },
  border: {
    color: { label: 'Border Color', type: 'color', default: '#333333' },
    width: { label: 'Border Width', type: 'range', min: 0, max: 10, unit: 'px', default: 1 },
    radius: { label: 'Border Radius', type: 'range', min: 0, max: 24, unit: 'px', default: 8 }
  }
}
