import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.join(__dirname, 'dist')
const PORT = process.env.PORT || 4173
const API_BASE = (process.env.VITE_API_URL ?? 'http://localhost:3333').replace(/\/+$/, '')

const MIME = {
  '.js':    'application/javascript',
  '.css':   'text/css',
  '.json':  'application/json',
  '.png':   'image/png',
  '.jpg':   'image/jpeg',
  '.jpeg':  'image/jpeg',
  '.webp':  'image/webp',
  '.svg':   'image/svg+xml',
  '.ico':   'image/x-icon',
  '.woff':  'font/woff',
  '.woff2': 'font/woff2',
  '.ttf':   'font/ttf',
  '.txt':   'text/plain',
}

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function fetchOgMeta(refCode) {
  try {
    const resp = await fetch(`${API_BASE}/api/register/meta/${encodeURIComponent(refCode)}`)
    if (!resp.ok) return null
    const data = await resp.json()
    return data?.ok ? data : null
  } catch {
    return null
  }
}

function injectOgTags(html, meta) {
  const title = escHtml(meta.ogTitle ?? 'Você recebeu um convite para Mancera!')
  const desc  = escHtml(meta.ogDescription ?? 'Registre-se agora e garanta um bônus especial')
  const img   = escHtml(meta.siteLogo ?? '')

  const tags = `
  <meta property="og:type"        content="website" />
  <meta property="og:title"       content="${title}" />
  <meta property="og:description" content="${desc}" />
  ${img ? `<meta property="og:image" content="${img}" />` : ''}
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="${title}" />
  <meta name="twitter:description" content="${desc}" />
  ${img ? `<meta name="twitter:image" content="${img}" />` : ''}`

  return html.replace('</head>', `${tags}\n  </head>`)
}

const server = http.createServer(async (req, res) => {
  const urlObj  = new URL(req.url ?? '/', `http://localhost`)
  const pathname = decodeURIComponent(urlObj.pathname)

  // Serve static assets from dist/
  const filePath = path.join(DIST, pathname)
  const ext = path.extname(filePath)

  if (ext && MIME[ext] && fs.existsSync(filePath)) {
    res.writeHead(200, { 'Content-Type': MIME[ext], 'Cache-Control': 'public, max-age=31536000, immutable' })
    fs.createReadStream(filePath).pipe(res)
    return
  }

  // SPA fallback — serve index.html
  const indexPath = path.join(DIST, 'index.html')
  let html = fs.readFileSync(indexPath, 'utf8')

  // Inject OG tags for referral / register links
  if (pathname === '/register') {
    const refCode = urlObj.searchParams.get('ref')?.trim().toUpperCase()
    if (refCode) {
      const meta = await fetchOgMeta(refCode)
      html = injectOgTags(html, meta ?? {
        ogTitle: 'Você recebeu um convite para Mancera!',
        ogDescription: 'Registre-se agora e garanta um bônus especial',
      })
    }
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
  res.end(html)
})

server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Frontend listening on port ${PORT}`)
})
