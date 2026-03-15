#!/usr/bin/env node

const { createHash } = require('node:crypto')
const { readFile, stat, copyFile, unlink } = require('node:fs/promises')
const { join } = require('node:path')
const { execSync } = require('node:child_process')
const { WebflowClient } = require('../lib/webflow-client')
const manifest = require('../lib/manifest')

const ASSETS_DIR = join(__dirname, '..', '..', '..', 'assets')
const MAX_SIZE = 4 * 1024 * 1024 // 4MB

async function main () {
  const force = process.argv.includes('--force')
  const client = new WebflowClient()
  const currentManifest = await manifest.read()

  const toUpload = manifest.getUnuploaded(currentManifest)
  if (toUpload.length === 0) {
    console.log('[upload] No assets to upload. All assets already in Webflow or skipped.')
    return
  }

  console.log(`[upload] ${toUpload.length} assets to upload`)

  // Build hash lookup from existing Webflow assets (for deduplication)
  console.log('[upload] Fetching existing Webflow assets for dedup...')
  const existingAssets = await client.listAssets()
  const hashMap = new Map()
  for (const asset of existingAssets) {
    if (asset.fileHash) hashMap.set(asset.fileHash, asset)
  }
  console.log(`[upload] ${existingAssets.length} existing assets, ${hashMap.size} with hashes`)

  let uploaded = 0
  let skippedDupe = 0
  let skippedOversized = 0
  let skippedMissing = 0
  let failed = 0

  for (const entry of toUpload) {
    const localPath = join(ASSETS_DIR, '..', entry.localPath)

    // Check file exists and size before reading into memory
    let fileStat
    try {
      fileStat = await stat(localPath)
    } catch {
      console.warn(`[upload] Missing: ${entry.localPath} — skipping`)
      entry.status = 'missing_locally'
      skippedMissing++
      await manifest.write(currentManifest)
      continue
    }

    if (fileStat.size > MAX_SIZE) {
      console.log(`[upload] Oversized: ${entry.filename} (${(fileStat.size / 1024 / 1024).toFixed(1)}MB) — compressing...`)
      const compressed = await compressImage(localPath, entry.filename)
      if (compressed) {
        const compressedStat = await stat(compressed)
        if (compressedStat.size <= MAX_SIZE) {
          console.log(`[upload] Compressed to ${(compressedStat.size / 1024 / 1024).toFixed(1)}MB`)
          // Swap localPath to compressed version for upload
          Object.defineProperty(entry, '_compressedPath', { value: compressed, configurable: true })
        } else {
          console.warn(`[upload] Still oversized after compression (${(compressedStat.size / 1024 / 1024).toFixed(1)}MB) — skipping`)
          entry.status = 'oversized'
          skippedOversized++
          await manifest.write(currentManifest)
          try { await unlink(compressed) } catch {}
          continue
        }
      } else {
        console.warn(`[upload] Compression failed — skipping`)
        entry.status = 'oversized'
        skippedOversized++
        await manifest.write(currentManifest)
        continue
      }
    }

    // Read file once — used for both hashing and upload
    const readPath = entry._compressedPath || localPath
    const fileBuffer = await readFile(readPath)
    const hash = createHash('md5').update(fileBuffer).digest('hex')
    entry.md5Hash = hash

    // Dedup check
    if (!force && hashMap.has(hash)) {
      const existing = hashMap.get(hash)
      console.log(`[upload] Duplicate: ${entry.filename} already in Webflow as "${existing.displayName}"`)
      entry.webflowAssetId = existing._id || existing.id
      entry.webflowUrl = existing.hostedUrl || existing.url
      entry.status = 'uploaded'
      skippedDupe++
      await manifest.write(currentManifest)
      continue
    }

    // Upload — pass buffer directly, no re-read
    try {
      console.log(`[upload] Uploading ${entry.filename}...`)
      const result = await client.uploadAsset(fileBuffer, entry.filename, hash)
      entry.webflowAssetId = result.assetId
      entry.webflowUrl = result.hostedUrl
      entry.status = 'uploaded'
      uploaded++
      console.log(`[upload] Done: ${entry.filename} → ${result.hostedUrl || 'pending'}`)
    } catch (err) {
      console.error(`[upload] Failed: ${entry.filename}: ${err.message}`)
      entry.status = 'upload_failed'
      failed++
    }

    // Save after each asset for crash resilience
    await manifest.write(currentManifest)
  }

  console.log(`\n[upload] Summary:`)
  console.log(`  Uploaded:  ${uploaded}`)
  console.log(`  Duplicate: ${skippedDupe}`)
  console.log(`  Oversized: ${skippedOversized}`)
  console.log(`  Missing:   ${skippedMissing}`)
  console.log(`  Failed:    ${failed}`)
}

async function compressImage (filePath, filename) {
  try {
    const tmpPath = filePath + '.compressed.jpg'
    // Use macOS sips to convert to JPEG at 80% quality and resize if very large
    execSync(`sips -s format jpeg -s formatOptions 80 "${filePath}" --out "${tmpPath}" 2>/dev/null`, { stdio: 'pipe' })
    // If still too big, resize down
    const s = await stat(tmpPath)
    if (s.size > MAX_SIZE) {
      execSync(`sips --resampleWidth 2400 "${tmpPath}" --out "${tmpPath}" 2>/dev/null`, { stdio: 'pipe' })
    }
    return tmpPath
  } catch {
    return null
  }
}

main().catch(err => {
  console.error(`[upload] Error: ${err.message}`)
  process.exit(1)
})
