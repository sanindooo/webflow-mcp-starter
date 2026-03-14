#!/usr/bin/env node

const { writeFile, mkdir } = require('node:fs/promises')
const { join, extname } = require('node:path')
const { FigmaClient } = require('../lib/figma-client')
const manifest = require('../lib/manifest')

const ASSETS_DIR = join(__dirname, '..', '..', '..', 'assets')

async function main () {
  const [,, fileKey, nodeId] = process.argv
  if (!fileKey || !nodeId) {
    console.error('Usage: node export-assets.js <fileKey> <nodeId>')
    console.error('  fileKey: From Figma URL — figma.com/design/<fileKey>/...')
    console.error('  nodeId:  From URL param — ?node-id=<nodeId> (use : separator)')
    process.exit(1)
  }

  const client = new FigmaClient()
  const currentManifest = await manifest.read()

  console.log(`[export] Fetching node tree for ${fileKey} / ${nodeId}...`)
  const fileData = await client.getFileNodes(fileKey, [nodeId], { depth: 10 })

  const nodes = fileData.nodes
  if (!nodes || !nodes[nodeId]) {
    console.error(`[export] Node ${nodeId} not found in file`)
    process.exit(1)
  }

  const rootNode = nodes[nodeId].document
  const componentName = toKebab(rootNode.name)

  // Walk the tree and classify assets
  const imageRefs = []   // Nodes with IMAGE fills (photos, backgrounds)
  const svgNodes = []    // Nodes to export as SVG (icons, logos)

  walkNode(rootNode, [], (node, path) => {
    if (node.visible === false) return false // skip hidden, don't recurse

    // Check for IMAGE fills
    if (node.fills) {
      for (const fill of node.fills) {
        if (fill.type === 'IMAGE' && fill.imageRef) {
          imageRefs.push({
            nodeId: node.id,
            name: node.name,
            imageRef: fill.imageRef,
            path: path.join(' > '),
            bounds: node.absoluteBoundingBox
          })
        }
      }
    }

    // Classify SVG-exportable nodes by name or parent frame
    const nameLower = node.name.toLowerCase()
    const pathStr = path.join(' > ').toLowerCase()
    if (nameLower.includes('icon') || pathStr.includes('icon')) {
      svgNodes.push({
        nodeId: node.id,
        name: node.name,
        path: path.join(' > '),
        type: 'icon'
      })
      return false // don't recurse into icon children
    }
    if (nameLower.includes('logo') || pathStr.includes('logo')) {
      svgNodes.push({
        nodeId: node.id,
        name: node.name,
        path: path.join(' > '),
        type: 'logo'
      })
      return false
    }

    return true // continue recursing
  })

  console.log(`[export] Found: ${imageRefs.length} image fills, ${svgNodes.length} SVG-exportable nodes`)

  // Ensure directories exist
  await mkdir(join(ASSETS_DIR, 'images'), { recursive: true })
  await mkdir(join(ASSETS_DIR, 'icons'), { recursive: true })
  await mkdir(join(ASSETS_DIR, 'logos'), { recursive: true })

  const usedFilenames = new Set()

  // 1. Download image fills (original quality photos/backgrounds)
  if (imageRefs.length > 0) {
    console.log('[export] Fetching image fill URLs...')
    const fillsData = await client.getImageFills(fileKey)
    const fillUrls = fillsData?.meta?.images || {}

    for (const ref of imageRefs) {
      const url = fillUrls[ref.imageRef]
      if (!url) {
        console.warn(`[export] No URL for imageRef ${ref.imageRef} (${ref.name})`)
        continue
      }

      const filename = uniqueFilename(usedFilenames, toKebab(ref.name), guessExtFromUrl(url) || '.png')
      const localPath = join('assets', 'images', filename)
      const fullPath = join(ASSETS_DIR, 'images', filename)

      console.log(`[export] Downloading ${filename}...`)
      await downloadFile(url, fullPath)

      manifest.upsert(currentManifest, {
        filename,
        originalFigmaName: ref.name,
        figmaNodeId: ref.nodeId,
        figmaImageRef: ref.imageRef,
        type: 'image',
        format: extname(filename).slice(1),
        dimensions: ref.bounds ? { width: Math.round(ref.bounds.width), height: Math.round(ref.bounds.height) } : null,
        localPath,
        context: { component: componentName, layerPath: ref.path, parentNodeId: nodeId },
        status: 'exported'
      })
    }
  }

  // 2. Export SVG nodes (icons and logos)
  if (svgNodes.length > 0) {
    const svgNodeIds = svgNodes.map(n => n.nodeId)
    console.log(`[export] Exporting ${svgNodeIds.length} SVG nodes...`)
    const svgData = await client.exportImages(fileKey, svgNodeIds, 'svg', { svgOutlineText: true })
    const svgUrls = svgData?.images || {}

    for (const node of svgNodes) {
      const url = svgUrls[node.nodeId]
      if (!url) {
        console.warn(`[export] No SVG URL for ${node.name} (${node.nodeId})`)
        continue
      }

      const dir = node.type === 'icon' ? 'icons' : 'logos'
      const filename = uniqueFilename(usedFilenames, toKebab(node.name), '.svg')
      const localPath = join('assets', dir, filename)
      const fullPath = join(ASSETS_DIR, dir, filename)

      console.log(`[export] Downloading ${dir}/${filename}...`)
      await downloadFile(url, fullPath)

      manifest.upsert(currentManifest, {
        filename,
        originalFigmaName: node.name,
        figmaNodeId: node.nodeId,
        type: node.type,
        format: 'svg',
        localPath,
        context: { component: componentName, layerPath: node.path, parentNodeId: nodeId },
        status: 'exported'
      })
    }
  }

  // Save manifest
  currentManifest.exportedAt = new Date().toISOString()
  await manifest.write(currentManifest)

  // Summary
  const exported = currentManifest.assets.filter(a => a.status === 'exported')
  console.log(`\n[export] Done! ${exported.length} assets exported.`)
  console.log(`[export] Manifest: assets/asset-manifest.json`)
  console.log(`[export] Next: run 'node scripts/api/webflow/upload-assets.js' to upload to Webflow`)
}

// Walk a Figma node tree depth-first
// callback returns true to continue recursing, false to stop
function walkNode (node, path, callback) {
  const currentPath = [...path, node.name]
  const shouldRecurse = callback(node, currentPath)
  if (shouldRecurse && node.children) {
    for (const child of node.children) {
      walkNode(child, currentPath, callback)
    }
  }
}

function toKebab (str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

function uniqueFilename (usedSet, baseName, ext) {
  let candidate = `${baseName}${ext}`
  let counter = 2
  while (usedSet.has(candidate)) {
    candidate = `${baseName}-${counter}${ext}`
    counter++
  }
  usedSet.add(candidate)
  return candidate
}

function guessExtFromUrl (url) {
  try {
    const pathname = new URL(url).pathname
    const ext = extname(pathname)
    if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.svg'].includes(ext)) return ext
  } catch {}
  return null
}

async function downloadFile (url, destPath) {
  if (!url.startsWith('https://')) {
    throw new Error(`Refusing to download from non-HTTPS URL: ${url}`)
  }
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed (${res.status}): ${url}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  await writeFile(destPath, buffer)
}

main().catch(err => {
  console.error(`[export] Error: ${err.message}`)
  process.exit(1)
})
