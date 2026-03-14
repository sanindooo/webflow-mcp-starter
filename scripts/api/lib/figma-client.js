const { setTimeout } = require('node:timers/promises')

const ALLOWED_HOSTS = ['api.figma.com']

class FigmaClient {
  constructor (token) {
    this.token = token || process.env.FIGMA_API_TOKEN
    if (!this.token) {
      throw new Error(
        'FIGMA_API_TOKEN is required. Generate one at https://www.figma.com/developers/api#access-tokens'
      )
    }
    this.baseUrl = 'https://api.figma.com/v1'
    this.maxRetries = 5
  }

  async _request (path, opts = {}) {
    const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`
    // Guard: only send token to Figma API domains
    const host = new URL(url).hostname
    if (!ALLOWED_HOSTS.includes(host)) {
      throw new Error(`Refusing to send auth token to non-Figma URL: ${url}`)
    }
    let lastError

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const res = await fetch(url, {
        ...opts,
        headers: {
          'X-Figma-Token': this.token,
          ...opts.headers
        }
      })

      if (res.status === 429 && attempt < this.maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000
        console.error(`[figma] rate limited, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${this.maxRetries})`)
        await setTimeout(delay)
        continue
      }

      if (res.status === 401) {
        throw new Error(
          'Figma token expired or invalid. Generate a new one at https://www.figma.com/developers/api#access-tokens'
        )
      }

      if (!res.ok) {
        const body = await res.text()
        lastError = new Error(`Figma API ${res.status}: ${body.slice(0, 500)}`)
        if (attempt < this.maxRetries && res.status >= 500) {
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000
          console.error(`[figma] server error, retrying in ${Math.round(delay)}ms`)
          await setTimeout(delay)
          continue
        }
        throw lastError
      }

      return res.json()
    }

    throw lastError || new Error('Max retries exceeded')
  }

  async getFileNodes (fileKey, nodeIds, opts = {}) {
    const params = new URLSearchParams()
    if (nodeIds?.length) params.set('ids', nodeIds.join(','))
    if (opts.depth) params.set('depth', String(opts.depth))
    const qs = params.toString()
    return this._request(`/files/${fileKey}/nodes${qs ? `?${qs}` : ''}`)
  }

  async getImageFills (fileKey) {
    return this._request(`/files/${fileKey}/images`)
  }

  async exportImages (fileKey, nodeIds, format = 'png', opts = {}) {
    const params = new URLSearchParams({
      ids: nodeIds.join(','),
      format
    })
    if (opts.scale) params.set('scale', String(opts.scale))
    if (opts.svgOutlineText) params.set('svg_outline_text', 'true')
    if (opts.svgIncludeId) params.set('svg_include_id', 'true')
    if (opts.contentsOnly) params.set('contents_only', 'true')
    return this._request(`/images/${fileKey}?${params.toString()}`)
  }
}

module.exports = { FigmaClient }
