#!/usr/bin/env node

const { WebflowClient } = require('../lib/webflow-client')

async function main () {
  const dryRun = process.argv.includes('--dry-run')
  const force = process.argv.includes('--force')
  const pageSlugArg = process.argv.find((a, i) => process.argv[i - 1] === '--page')
  const client = new WebflowClient()

  console.log('[seo] Fetching Webflow pages...')
  const pages = await client.listPages()

  let targets = pages
  if (pageSlugArg) {
    targets = pages.filter(p => p.slug === pageSlugArg)
    if (targets.length === 0) {
      console.error(`[seo] No page found with slug "${pageSlugArg}"`)
      console.error(`[seo] Available slugs: ${pages.map(p => p.slug).join(', ')}`)
      process.exit(1)
    }
  }

  if (!force) {
    // Filter to pages missing SEO data
    targets = targets.filter(p => {
      const seo = p.seo || {}
      return !seo.title || !seo.description
    })
  }

  if (targets.length === 0) {
    console.log('[seo] All pages have SEO metadata. Nothing to update.')
    return
  }

  console.log(`[seo] ${targets.length} pages to process`)

  if (dryRun) {
    console.log('\n[seo] Dry run — current SEO state:\n')
    for (const page of targets) {
      const seo = page.seo || {}
      const og = page.openGraph || {}
      console.log(`  ${page.title || page.slug}`)
      console.log(`    Slug:        /${page.slug}`)
      console.log(`    Page ID:     ${page._id || page.id}`)
      console.log(`    SEO Title:   ${seo.title || '(empty)'}`)
      console.log(`    SEO Desc:    ${seo.description || '(empty)'}`)
      console.log(`    OG Title:    ${og.title || '(empty)'}`)
      console.log(`    OG Desc:     ${og.description || '(empty)'}`)
      console.log()
    }
    console.log('[seo] Run without --dry-run to apply changes.')
    console.log('[seo] Note: Content analysis and SEO generation requires the /update-seo skill (Claude).')
    return
  }

  // Output JSON for programmatic use by the skill wrapper
  const output = targets.map(p => ({
    id: p._id || p.id,
    title: p.title,
    slug: p.slug,
    currentSeo: p.seo || {},
    currentOg: p.openGraph || {}
  }))

  console.log(JSON.stringify(output, null, 2))
  console.log(`\n[seo] ${output.length} pages output. Use /update-seo skill to generate and apply SEO metadata.`)
}

main().catch(err => {
  console.error(`[seo] Error: ${err.message}`)
  process.exit(1)
})
