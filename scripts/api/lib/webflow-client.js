const { createHash } = require('node:crypto')
const { setTimeout } = require('node:timers/promises')

class WebflowClient {
  constructor (opts = {}) {
    this.token = opts.token || process.env.WEBFLOW_API_TOKEN
    this.siteId = opts.siteId || process.env.WEBFLOW_SITE_ID
    if (!this.token) {
      throw new Error(
        'WEBFLOW_API_TOKEN is required. Generate one at https://webflow.com/dashboard/integrations/api-tokens'
      )
    }
    if (!this.siteId) {
      throw new Error(
        'WEBFLOW_SITE_ID is required. Find it in Webflow Site Settings > General.'
      )
    }
    this.baseUrl = 'https://api.webflow.com/v2'
    this.maxRetries = 5
  }

  async _request (path, opts = {}) {
    const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`
    // Guard: only send Bearer token to Webflow domains
    if (url.startsWith('http') && !url.startsWith('https://api.webflow.com/')) {
      throw new Error(`Refusing to send auth token to non-Webflow URL: ${url}`)
    }
    let lastError

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const headers = {
        Authorization: `Bearer ${this.token}`,
        ...opts.headers
      }
      if (opts.json) {
        headers['Content-Type'] = 'application/json'
      }

      const fetchOpts = {
        method: opts.method || 'GET',
        headers
      }
      if (opts.json && opts.body) throw new Error('Cannot pass both json and body to _request')
      if (opts.json) fetchOpts.body = JSON.stringify(opts.json)
      else if (opts.body) fetchOpts.body = opts.body

      const res = await fetch(url, fetchOpts)

      if (res.status === 429 && attempt < this.maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000
        console.error(`[webflow] rate limited, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${this.maxRetries})`)
        await setTimeout(delay)
        continue
      }

      if (res.status === 401) {
        throw new Error(
          'Webflow token expired or invalid. Generate a new one at https://webflow.com/dashboard/integrations/api-tokens'
        )
      }

      if (!res.ok) {
        const body = await res.text()
        lastError = new Error(`Webflow API ${res.status}: ${body.slice(0, 500)}`)
        if (attempt < this.maxRetries && res.status >= 500) {
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000
          console.error(`[webflow] server error, retrying in ${Math.round(delay)}ms`)
          await setTimeout(delay)
          continue
        }
        throw lastError
      }

      if (res.status === 204) return {}
      return res.json()
    }

    throw lastError || new Error('Max retries exceeded')
  }

  async listAssets () {
    const assets = []
    let offset = 0
    const limit = 100
    while (true) {
      const res = await this._request(`/sites/${this.siteId}/assets?limit=${limit}&offset=${offset}`)
      assets.push(...(res.assets || []))
      if (!res.assets || res.assets.length < limit) break
      offset += limit
    }
    return assets
  }

  async uploadAsset (fileBuffer, fileName, precomputedHash) {
    const hash = precomputedHash || createHash('md5').update(fileBuffer).digest('hex')

    // Step 1: Get presigned URL from Webflow
    const presigned = await this._request(`/sites/${this.siteId}/assets`, {
      method: 'POST',
      json: { fileName, fileHash: hash }
    })

    const { uploadUrl, uploadDetails } = presigned

    // Step 2: Upload binary to S3 via multipart form
    const formData = new FormData()
    for (const [key, value] of Object.entries(uploadDetails)) {
      formData.append(key, value)
    }
    formData.append('file', new Blob([fileBuffer]), fileName)

    const s3Res = await fetch(uploadUrl, {
      method: 'POST',
      body: formData
    })

    if (!s3Res.ok) {
      throw new Error(`S3 upload failed (${s3Res.status}): ${await s3Res.text()}`)
    }

    return {
      assetId: presigned.asset?._id || presigned.asset?.id,
      hostedUrl: presigned.asset?.hostedUrl || presigned.asset?.url,
      displayName: fileName,
      fileHash: hash
    }
  }

  async updateAsset (assetId, updates) {
    return this._request(`/sites/${this.siteId}/assets/${assetId}`, {
      method: 'PATCH',
      json: updates
    })
  }

  async listPages () {
    const pages = []
    let offset = 0
    const limit = 100
    while (true) {
      const res = await this._request(`/sites/${this.siteId}/pages?limit=${limit}&offset=${offset}`)
      pages.push(...(res.pages || []))
      if (!res.pages || res.pages.length < limit) break
      offset += limit
    }
    return pages
  }

  async updatePageSeo (pageId, seoData) {
    const body = {}
    if (seoData.seoTitle !== undefined) {
      body.seo = body.seo || {}
      body.seo.title = seoData.seoTitle
    }
    if (seoData.seoDescription !== undefined) {
      body.seo = body.seo || {}
      body.seo.description = seoData.seoDescription
    }
    if (seoData.ogTitle !== undefined) {
      body.openGraph = body.openGraph || {}
      body.openGraph.title = seoData.ogTitle
    }
    if (seoData.ogDescription !== undefined) {
      body.openGraph = body.openGraph || {}
      body.openGraph.description = seoData.ogDescription
    }
    // Uses beta endpoint for page settings
    return this._request(`https://api.webflow.com/beta/pages/${pageId}`, {
      method: 'PUT',
      json: body
    })
  }

}

module.exports = { WebflowClient }
