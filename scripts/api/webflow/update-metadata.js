#!/usr/bin/env node

const { WebflowClient } = require('../lib/webflow-client')

async function main () {
  const dryRun = process.argv.includes('--dry-run')
  const force = process.argv.includes('--force')
  const client = new WebflowClient()

  console.log('[metadata] Fetching Webflow assets...')
  const assets = await client.listAssets()

  const needsAltText = assets.filter(a => {
    if (force) return true
    return !a.altText || a.altText.trim() === ''
  })

  if (needsAltText.length === 0) {
    console.log('[metadata] All assets have alt text. Nothing to update.')
    return
  }

  console.log(`[metadata] ${needsAltText.length} assets need alt text`)

  if (dryRun) {
    console.log('\n[metadata] Dry run — listing assets that need alt text:\n')
    for (const asset of needsAltText) {
      const url = asset.hostedUrl || asset.url || 'no-url'
      console.log(`  ${asset.displayName || asset.fileName}`)
      console.log(`    ID:  ${asset._id || asset.id}`)
      console.log(`    URL: ${url}`)
      console.log(`    Alt: ${asset.altText || '(empty)'}`)
      console.log()
    }
    console.log('[metadata] Run without --dry-run to apply changes.')
    console.log('[metadata] Note: Alt text generation requires the /asset-metadata skill (Claude vision).')
    return
  }

  // When run directly (not via skill), output JSON for programmatic use
  const output = needsAltText.map(a => ({
    id: a._id || a.id,
    displayName: a.displayName || a.fileName,
    url: a.hostedUrl || a.url,
    currentAltText: a.altText || null
  }))

  console.log(JSON.stringify(output, null, 2))
  console.log(`\n[metadata] ${output.length} assets output. Use /asset-metadata skill to generate and apply alt text.`)
}

main().catch(err => {
  console.error(`[metadata] Error: ${err.message}`)
  process.exit(1)
})
