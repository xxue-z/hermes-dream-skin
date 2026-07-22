/**
 * 构建脚本
 *
 * 将插件源码打包为单个 plugin.js 文件
 * 自动内联 import 语句，按依赖顺序拼接
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.join(__dirname, 'src')
const outputFile = path.join(__dirname, 'plugin.js')

function processFile(filePath, fileName) {
  let content = fs.readFileSync(filePath, 'utf8')

  // 移除 export { ... } from './xxx' 形式的重新导出
  content = content.replace(/export\s*\{[^}]*\}\s*from\s*['"][^'"]+['"];?\n?/g, '')

  // 移除 import 语句（因为它们已经按顺序定义在同一文件中了）
  content = content.replace(/^import\s+.*?\s*from\s*['"][^'"]+['"];?\n?/gm, '')
  // 也移除没有 from 的 import（如 import './something'）
  content = content.replace(/^import\s+['"][^'"]+['"];?\n?/gm, '')

  // 将 export class/function/const/let/var 改为不导出（因为所有代码在同一个模块中）
  content = content.replace(/export\s+(class|function|const|let|var)\s+/g, '$1 ')

  // 处理默认导出（保留为变量）
  content = content.replace(/export\s+default\s+/, 'const __DEFAULT_EXPORT__ = ')

  return content.trim()
}

/**
 * 读取所有 src 目录下的 .js 文件并合并
 */
function buildPlugin() {
  // 定义模块依赖顺序（被依赖的先定义）
  const files = [
    { path: 'style-config.js', name: 'style-config' },
    { path: 'style-editor.js', name: 'style-editor' },
    { path: 'theme-manager.js', name: 'theme-manager' },
    { path: 'css-injector.js', name: 'css-injector' },
    { path: 'ui/panel.js', name: 'panel' },
    { path: 'index.js', name: 'index' }
  ]

  let output = ''

  // 添加插件入口注释
  output += `/**\n * Hermes Dream Skin Plugin\n * Generated at: ${new Date().toISOString()}\n */\n\n`

  // 导入 React（Hermes Desktop 插件环境可用）
  output += `import React from 'react'\n\n`

  for (const fileInfo of files) {
    const filePath = path.join(srcDir, fileInfo.path)

    if (!fs.existsSync(filePath)) {
      console.warn(`Warning: File not found: ${filePath}`)
      continue
    }

    const processed = processFile(filePath, fileInfo.name)
    output += `// --- ${fileInfo.path} ---\n`
    output += processed
    output += '\n\n'
  }

  // 添加插件导出
  output += `// --- Plugin Entry ---\n`
  output += `export default {\n`
  output += `  id: 'hermes-dream-skin',\n`
  output += `  name: 'Hermes Dream Skin',\n`
  output += `  defaultEnabled: true,\n`
  output += `  register(ctx) {\n`
  output += `    const plugin = new DreamSkinPlugin(ctx)\n`
  output += `    plugin.init()\n`
  output += `  }\n`
  output += `}\n`

  fs.writeFileSync(outputFile, output, 'utf8')
  console.log(`Built: ${outputFile}`)
}

buildPlugin()
