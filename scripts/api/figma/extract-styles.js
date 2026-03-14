#!/usr/bin/env node

const { FigmaClient } = require('../lib/figma-client')

const BASE_FONT_SIZE = 16

async function main () {
  const [,, fileKey, nodeId] = process.argv
  if (!fileKey || !nodeId) {
    console.error('Usage: node extract-styles.js <fileKey> <nodeId>')
    process.exit(1)
  }

  const client = new FigmaClient()

  console.error(`[styles] Fetching node data for ${fileKey} / ${nodeId}...`)
  const fileData = await client.getFileNodes(fileKey, [nodeId], { depth: 10 })

  const nodes = fileData.nodes
  if (!nodes || !nodes[nodeId]) {
    console.error(`[styles] Node ${nodeId} not found`)
    process.exit(1)
  }

  const rootNode = nodes[nodeId].document
  const styles = {}

  walkNode(rootNode, (node) => {
    if (node.visible === false) return

    const css = extractCss(node)
    if (Object.keys(css).length > 0) {
      styles[node.id] = {
        name: node.name,
        type: node.type,
        css
      }
    }
  })

  // Output to stdout for capture by skills
  console.log(JSON.stringify(styles, null, 2))
  console.error(`[styles] Extracted styles for ${Object.keys(styles).length} nodes`)
}

function extractCss (node) {
  const css = {}

  // Typography
  if (node.style) {
    const s = node.style
    if (s.fontSize) css['font-size'] = pxToRem(s.fontSize)
    if (s.fontFamily) css['font-family'] = s.fontFamily
    if (s.fontWeight) css['font-weight'] = String(s.fontWeight)
    if (s.lineHeightPx && s.fontSize) {
      css['line-height'] = (s.lineHeightPx / s.fontSize).toFixed(3)
    }
    if (s.letterSpacing !== undefined) {
      css['letter-spacing'] = s.letterSpacing === 0 ? 'normal' : pxToRem(s.letterSpacing)
    }
    if (s.textCase === 'UPPER') css['text-transform'] = 'uppercase'
    if (s.textCase === 'LOWER') css['text-transform'] = 'lowercase'
    if (s.textAlignHorizontal) {
      const map = { LEFT: 'left', CENTER: 'center', RIGHT: 'right', JUSTIFIED: 'justify' }
      css['text-align'] = map[s.textAlignHorizontal] || 'left'
    }
  }

  // Colors from fills
  if (node.fills?.length) {
    const solidFill = node.fills.find(f => f.type === 'SOLID' && f.visible !== false)
    if (solidFill?.color) {
      css.color = rgbaToHex(solidFill.color, solidFill.opacity)
    }
  }

  // Background fills
  if (node.backgroundColor) {
    css['background-color'] = rgbaToHex(node.backgroundColor)
  }
  if (node.fills?.length && node.type !== 'TEXT') {
    const bgFill = node.fills.find(f => f.type === 'SOLID' && f.visible !== false)
    if (bgFill?.color) {
      css['background-color'] = rgbaToHex(bgFill.color, bgFill.opacity)
    }
  }

  // Dimensions
  if (node.absoluteBoundingBox) {
    const box = node.absoluteBoundingBox
    if (box.width) css.width = pxToRem(box.width)
    if (box.height) css.height = pxToRem(box.height)
  }

  // Border radius
  if (node.cornerRadius) css['border-radius'] = pxToRem(node.cornerRadius)

  // Strokes
  if (node.strokes?.length) {
    const stroke = node.strokes.find(s => s.type === 'SOLID' && s.visible !== false)
    if (stroke?.color && node.strokeWeight) {
      css['border-width'] = pxToRem(node.strokeWeight)
      css['border-color'] = rgbaToHex(stroke.color, stroke.opacity)
      css['border-style'] = 'solid'
    }
  }

  // Effects (shadows, blurs)
  if (node.effects?.length) {
    const shadows = []
    for (const effect of node.effects) {
      if (!effect.visible) continue
      if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
        const inset = effect.type === 'INNER_SHADOW' ? 'inset ' : ''
        const x = pxToRem(effect.offset?.x || 0)
        const y = pxToRem(effect.offset?.y || 0)
        const blur = pxToRem(effect.radius || 0)
        const spread = pxToRem(effect.spread || 0)
        const color = rgbaToHex(effect.color, effect.color?.a)
        shadows.push(`${inset}${x} ${y} ${blur} ${spread} ${color}`)
      }
      if (effect.type === 'LAYER_BLUR') {
        css.filter = `blur(${pxToRem(effect.radius)})`
      }
    }
    if (shadows.length) css['box-shadow'] = shadows.join(', ')
  }

  // Auto-layout (flexbox)
  if (node.layoutMode) {
    css.display = 'flex'
    css['flex-direction'] = node.layoutMode === 'HORIZONTAL' ? 'row' : 'column'

    if (node.itemSpacing !== undefined) css.gap = pxToRem(node.itemSpacing)
    if (node.paddingLeft) css['padding-left'] = pxToRem(node.paddingLeft)
    if (node.paddingRight) css['padding-right'] = pxToRem(node.paddingRight)
    if (node.paddingTop) css['padding-top'] = pxToRem(node.paddingTop)
    if (node.paddingBottom) css['padding-bottom'] = pxToRem(node.paddingBottom)

    const alignMap = { MIN: 'flex-start', CENTER: 'center', MAX: 'flex-end', SPACE_BETWEEN: 'space-between' }
    if (node.primaryAxisAlignItems) css['justify-content'] = alignMap[node.primaryAxisAlignItems] || 'flex-start'
    if (node.counterAxisAlignItems) css['align-items'] = alignMap[node.counterAxisAlignItems] || 'flex-start'
  }

  return css
}

function pxToRem (px) {
  if (px === 0) return '0'
  return `${(px / BASE_FONT_SIZE).toFixed(4).replace(/\.?0+$/, '')}rem`
}

function rgbaToHex (color, opacity) {
  if (!color) return '#000000'
  const r = Math.round((color.r || 0) * 255)
  const g = Math.round((color.g || 0) * 255)
  const b = Math.round((color.b || 0) * 255)
  const a = opacity !== undefined ? opacity : (color.a !== undefined ? color.a : 1)
  const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  if (a < 1) {
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`
  }
  return hex
}

function walkNode (node, callback) {
  callback(node)
  if (node.children) {
    for (const child of node.children) {
      walkNode(child, callback)
    }
  }
}

main().catch(err => {
  console.error(`[styles] Error: ${err.message}`)
  process.exit(1)
})
