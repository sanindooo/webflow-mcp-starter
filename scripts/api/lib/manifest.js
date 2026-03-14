const { readFile, writeFile, rename } = require('node:fs/promises')
const { join, dirname } = require('node:path')
const { randomBytes } = require('node:crypto')

const MANIFEST_PATH = join(__dirname, '..', '..', '..', 'assets', 'asset-manifest.json')

const DEFAULT_MANIFEST = {
  exportedAt: null,
  assets: []
}

async function read (manifestPath) {
  const path = manifestPath || MANIFEST_PATH
  try {
    const raw = await readFile(path, 'utf-8')
    return JSON.parse(raw)
  } catch (err) {
    if (err.code === 'ENOENT') return { ...DEFAULT_MANIFEST, assets: [] }
    throw err
  }
}

async function write (manifest, manifestPath) {
  const path = manifestPath || MANIFEST_PATH
  // Atomic write: write to temp file then rename
  const tmpPath = join(dirname(path), `.asset-manifest.${randomBytes(4).toString('hex')}.tmp`)
  const data = JSON.stringify(manifest, null, 2) + '\n'
  await writeFile(tmpPath, data, 'utf-8')
  await rename(tmpPath, path)
}

function upsert (manifest, entry) {
  const idx = manifest.assets.findIndex(a => a.figmaNodeId === entry.figmaNodeId)
  if (idx >= 0) {
    const existing = manifest.assets[idx]
    manifest.assets[idx] = {
      ...existing,
      ...entry,
      webflowAssetId: entry.webflowAssetId ?? existing.webflowAssetId,
      webflowUrl: entry.webflowUrl ?? existing.webflowUrl
    }
  } else {
    manifest.assets.push(entry)
  }
}

function findByNodeId (manifest, nodeId) {
  return manifest.assets.find(a => a.figmaNodeId === nodeId) || null
}

function getUnuploaded (manifest) {
  return manifest.assets.filter(a => !a.webflowAssetId && a.status !== 'oversized' && a.status !== 'missing_locally')
}

module.exports = { read, write, upsert, findByNodeId, getUnuploaded, MANIFEST_PATH }
