#!/usr/bin/env node

const { readFile, stat, readdir } = require('node:fs/promises')
const { join, extname, basename, resolve, relative } = require('node:path')
const XLSX = require('xlsx')
const mammoth = require('mammoth')

const SUPPORTED_EXTENSIONS = ['.xlsx', '.csv', '.docx']
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB
const MAX_DIR_FILES = 200
const MAX_DIR_DEPTH = 5

// Safe XLSX parse options — disable formula evaluation
const XLSX_SAFE_OPTS = { cellFormula: false, cellNF: false }

async function main () {
  const input = process.argv[2]
  if (!input) {
    console.error('Usage: pnpm parse-copy <file|folder|google-sheets-url>')
    console.error('')
    console.error('Examples:')
    console.error('  pnpm parse-copy docs/examples/GTFO-Content-Final-Updated.xlsx')
    console.error('  pnpm parse-copy "docs/examples/pier point copy"')
    console.error('  pnpm parse-copy "https://docs.google.com/spreadsheets/d/SHEET_ID/edit"')
    process.exit(1)
  }

  let result

  if (input.startsWith('https://docs.google.com/spreadsheets/')) {
    result = await parseGoogleSheet(input)
  } else {
    // Resolve to absolute path and verify it's within the working directory
    const resolved = resolve(input)
    const cwd = process.cwd()
    if (!resolved.startsWith(cwd)) {
      console.error('[parse-copy] Path must be within the project directory')
      process.exit(1)
    }

    const info = await stat(resolved)
    if (info.isDirectory()) {
      result = await parseFolder(resolved)
    } else {
      await checkFileSize(resolved)
      result = await parseFile(resolved)
    }
  }

  // Relativize source paths before output
  if (result.source && !result.source.startsWith('http')) {
    result.source = relative(process.cwd(), result.source)
  }

  // Output JSON to stdout
  console.log(JSON.stringify(result, null, 2))
}

// ── Google Sheets ──────────────────────────────────────────────

async function parseGoogleSheet (url) {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
  if (!match) {
    throw new Error('Could not extract sheet ID from URL')
  }
  const sheetId = match[1]
  const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`

  console.error(`[parse-copy] Fetching Google Sheet ${sheetId}...`)
  const res = await fetch(exportUrl, { redirect: 'error' })

  if (!res.ok) {
    throw new Error(`Failed to fetch sheet (${res.status}). Is the sheet published or shared with "Anyone with the link"?`)
  }

  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('text/html')) {
    throw new Error('Received HTML instead of spreadsheet data. The sheet may be private. Ensure it is shared as "Anyone with the link can view".')
  }

  // Check response size before buffering
  const contentLength = parseInt(res.headers.get('content-length') || '0', 10)
  if (contentLength > MAX_FILE_SIZE) {
    throw new Error(`Sheet too large (${Math.round(contentLength / 1024 / 1024)}MB). Max: ${MAX_FILE_SIZE / 1024 / 1024}MB`)
  }

  const buffer = Buffer.from(await res.arrayBuffer())
  const workbook = XLSX.read(buffer, { type: 'buffer', ...XLSX_SAFE_OPTS })

  return {
    source: url,
    pages: parseWorkbookSheets(workbook),
    skippedFiles: []
  }
}

// ── Folder ─────────────────────────────────────────────────────

async function parseFolder (dirPath) {
  const entries = await readdirRecursive(dirPath, 0)
  const files = entries.filter(f => SUPPORTED_EXTENSIONS.includes(extname(f).toLowerCase()))
  const skipped = entries.filter(f => !SUPPORTED_EXTENSIONS.includes(extname(f).toLowerCase()))

  if (files.length === 0) {
    throw new Error(`No supported files found in ${basename(dirPath)}. Supported: ${SUPPORTED_EXTENSIONS.join(', ')}`)
  }

  console.error(`[parse-copy] Found ${files.length} files to parse in ${basename(dirPath)}`)
  if (skipped.length > 0) {
    console.error(`[parse-copy] Skipping ${skipped.length} unsupported files: ${skipped.map(f => basename(f)).join(', ')}`)
  }

  const allPages = []
  for (const file of files) {
    await checkFileSize(file)
    const result = await parseFile(file)
    allPages.push(...result.pages)
  }

  return {
    source: dirPath,
    pages: allPages,
    skippedFiles: skipped.map(f => basename(f))
  }
}

async function readdirRecursive (dirPath, depth) {
  if (depth > MAX_DIR_DEPTH) {
    console.error(`[parse-copy] Max directory depth (${MAX_DIR_DEPTH}) reached, skipping deeper levels`)
    return []
  }

  const entries = await readdir(dirPath, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    if (files.length >= MAX_DIR_FILES) {
      console.error(`[parse-copy] Max file count (${MAX_DIR_FILES}) reached, stopping scan`)
      break
    }
    const fullPath = join(dirPath, entry.name)
    if (entry.name.startsWith('.')) continue
    if (entry.isSymbolicLink()) continue
    if (entry.isDirectory()) {
      files.push(...await readdirRecursive(fullPath, depth + 1))
    } else {
      files.push(fullPath)
    }
  }
  return files
}

// ── Single file dispatch ───────────────────────────────────────

async function parseFile (filePath) {
  const ext = extname(filePath).toLowerCase()

  switch (ext) {
    case '.xlsx':
      return parseXlsx(filePath)
    case '.csv':
      return parseCsv(filePath)
    case '.docx':
      return parseDocx(filePath)
    default:
      throw new Error(`Unsupported file type: ${ext}`)
  }
}

async function checkFileSize (filePath) {
  const info = await stat(filePath)
  if (info.size > MAX_FILE_SIZE) {
    throw new Error(`File too large: ${basename(filePath)} (${Math.round(info.size / 1024 / 1024)}MB). Max: ${MAX_FILE_SIZE / 1024 / 1024}MB`)
  }
}

// ── XLSX ───────────────────────────────────────────────────────

function parseXlsx (filePath) {
  console.error(`[parse-copy] Parsing XLSX: ${basename(filePath)}`)
  const workbook = XLSX.readFile(filePath, XLSX_SAFE_OPTS)

  // Detect locale from filename — applies to all sheets if found
  const fileLocale = detectLocaleFromName(basename(filePath, '.xlsx'))

  return {
    source: filePath,
    pages: parseWorkbookSheets(workbook, fileLocale),
    skippedFiles: []
  }
}

function parseWorkbookSheets (workbook, fileLocale = null) {
  const pages = []

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })

    if (rows.length < 2) {
      console.error(`[parse-copy] Skipping empty sheet: ${sheetName}`)
      continue
    }

    const header = rows[0].map(h => String(h || '').toLowerCase().trim())
    const format = detectXlsxFormat(header)

    const sections = []
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      if (!row || !row[0]) continue

      const label = String(row[0]).trim()
      if (!label) continue

      const contentCol = format === '3-col' ? 2 : 1
      const content = row[contentCol] != null ? String(row[contentCol]).trim() : ''
      if (!content) continue

      sections.push({
        label,
        content,
        richText: false
      })
    }

    if (sections.length === 0) {
      console.error(`[parse-copy] Skipping sheet with no content: ${sheetName}`)
      continue
    }

    pages.push({
      page: sheetName,
      locale: fileLocale || detectLocaleFromName(sheetName),
      sections
    })
  }

  return pages
}

function detectXlsxFormat (header) {
  // 3-col format: Section | Word Count | Content
  if (header.length >= 3) {
    const hasWordCount = header.some(h =>
      h.includes('word count') || h.includes('word_count') || h.includes('wordcount')
    )
    if (hasWordCount) return '3-col'
  }
  // Default: 2-col (Section | Content)
  return '2-col'
}

// ── CSV ────────────────────────────────────────────────────────

function parseCsv (filePath) {
  console.error(`[parse-copy] Parsing CSV: ${basename(filePath)}`)
  const workbook = XLSX.readFile(filePath, XLSX_SAFE_OPTS)

  // CSV produces a single sheet — reuse parseWorkbookSheets, then rename
  const fileLocale = detectLocaleFromName(basename(filePath, '.csv'))
  const pages = parseWorkbookSheets(workbook, fileLocale)

  // Override sheet name (usually "Sheet1") with cleaned filename
  const pageName = cleanPageName(basename(filePath, '.csv'))
  if (pages.length > 0) {
    pages[0].page = pageName
  }

  return {
    source: filePath,
    pages,
    skippedFiles: []
  }
}

// ── DOCX ───────────────────────────────────────────────────────

async function parseDocx (filePath) {
  console.error(`[parse-copy] Parsing DOCX: ${basename(filePath)}`)

  const buffer = await readFile(filePath)

  // Extract structured content with mammoth
  const htmlResult = await mammoth.convertToHtml({ buffer })
  const html = htmlResult.value

  // Parse the HTML to extract sections
  const sections = parseDocxHtml(html)

  if (sections.length === 0) {
    console.error(`[parse-copy] No sections found in: ${basename(filePath)} (may not be a copy document)`)
    return { source: filePath, pages: [], skippedFiles: [basename(filePath)] }
  }

  const pageName = cleanPageName(basename(filePath, '.docx'))

  return {
    source: filePath,
    pages: [{
      page: pageName,
      locale: detectLocaleFromName(pageName),
      sections
    }],
    skippedFiles: []
  }
}

function parseDocxHtml (html) {
  const sections = []

  const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi
  const matches = [...html.matchAll(headingRegex)]

  if (matches.length === 0) {
    return []
  }

  // Check if this doc has content between headings or if headings ARE the content
  let hasContentBetweenHeadings = false
  for (let i = 0; i < matches.length; i++) {
    const startIdx = matches[i].index + matches[i][0].length
    const endIdx = i + 1 < matches.length ? matches[i + 1].index : html.length
    const between = stripHtml(html.slice(startIdx, endIdx)).trim()
    if (between) {
      hasContentBetweenHeadings = true
      break
    }
  }

  if (hasContentBetweenHeadings) {
    // Standard mode: headings are labels, content is between them
    for (let i = 0; i < matches.length; i++) {
      const label = stripHtml(matches[i][2]).trim()
      if (!label) continue

      const startIdx = matches[i].index + matches[i][0].length
      const endIdx = i + 1 < matches.length ? matches[i + 1].index : html.length
      const contentHtml = html.slice(startIdx, endIdx).trim()

      if (!contentHtml) continue

      const contentText = stripHtml(contentHtml).trim()
      if (!contentText) continue

      const hasRichText = /<(strong|em|b|i|a\s)/.test(contentHtml)

      const section = {
        label,
        content: contentText,
        richText: hasRichText
      }

      if (hasRichText) {
        section.richTextHtml = sanitizeRichTextHtml(contentHtml)
      }

      sections.push(section)
    }
  } else {
    // Flat mode: headings ARE the content, grouped under H1 parents
    // H1 = section label, H2/H3/... = content items within that section
    let currentH1 = null
    let childTexts = []

    const flushSection = () => {
      if (currentH1 && childTexts.length > 0) {
        sections.push({
          label: currentH1,
          content: childTexts.join('\n\n'),
          richText: false
        })
      } else if (currentH1) {
        sections.push({
          label: currentH1,
          content: currentH1,
          richText: false
        })
      }
      childTexts = []
    }

    for (const match of matches) {
      const level = parseInt(match[1])
      const text = stripHtml(match[2]).trim()
      if (!text) continue

      if (level === 1) {
        flushSection()
        currentH1 = text
      } else {
        childTexts.push(text)
      }
    }
    flushSection()
  }

  return sections
}

function stripHtml (html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim()
}

function sanitizeRichTextHtml (html) {
  // Strip dangerous tags and attributes, keep only safe formatting
  return html
    // Remove script/style/iframe tags and their content
    .replace(/<(script|style|iframe)[^>]*>[\s\S]*?<\/\1>/gi, '')
    // Remove on* event attributes
    .replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\s+on\w+\s*=\s*\S+/gi, '')
    // Remove javascript: hrefs
    .replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"')
    // Remove empty paragraphs
    .replace(/<p>\s*<\/p>/gi, '')
    .trim()
}

// ── Utilities ──────────────────────────────────────────────────

function cleanPageName (name) {
  // Extract page name from common filename patterns
  // "Pierpoint - Homepage Copy" → "Homepage"
  // "GTFO-Content-Final-Updated" → "GTFO-Content-Final-Updated" (no dash-space separator)

  // If there's a " - " separator, take the part after the first one
  const dashParts = name.split(/\s+-\s+/)
  if (dashParts.length > 1) {
    name = dashParts.slice(1).join(' - ').trim()
  }

  // Strip trailing "Copy" / "Page Copy" / "Content" suffixes
  return name
    .replace(/\s+copy$/i, '')
    .replace(/\s+page\s+copy$/i, '')
    .replace(/\s+content$/i, '')
    .trim()
}

function detectLocaleFromName (name) {
  const lower = name.toLowerCase()

  // Only detect locale when filename explicitly contains "translation" or "locale"
  // context, OR when a locale code appears with a delimiter pattern like -nl- or _fr_
  // This avoids false positives on short codes like "no", "it", "de", "fi", etc.

  const hasLocaleContext = lower.includes('translation') || lower.includes('locale') || lower.includes('i18n')

  // Common unambiguous locale codes (3+ chars or very distinctive)
  const unambiguousCodes = ['nl', 'fr', 'es', 'pt', 'ja', 'ko', 'zh', 'ru', 'sv', 'da']
  // Ambiguous codes that need explicit locale context in filename
  const ambiguousCodes = ['de', 'it', 'no', 'fi', 'pl', 'cs', 'tr', 'el', 'hu', 'ro', 'bg', 'hr', 'sk', 'sl', 'et', 'lv', 'lt', 'ar']

  const codesToCheck = hasLocaleContext
    ? [...unambiguousCodes, ...ambiguousCodes]
    : unambiguousCodes

  for (const code of codesToCheck) {
    // Only match with clear delimiter patterns: -nl-, _nl_, -nl (end), _nl (end)
    const delimiterPattern = new RegExp(`[-_]${code}(?:[-_. ]|$)`, 'i')
    if (delimiterPattern.test(lower)) {
      return code
    }
  }

  return null
}

main().catch(err => {
  console.error(`[parse-copy] Error: ${err.message}`)
  process.exit(1)
})
