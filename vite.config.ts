import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { ViteDevServer } from 'vite'

// ── OG-tag injection plugin ──────────────────────────────────────────────────
function ogTagsPlugin() {
  const __dirname = fileURLToPath(new URL('.', import.meta.url))

  function escHtml(str: string): string {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  return {
    name: 'og-tags-inject',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = req.url ?? '/'
        // Only intercept the register page with a ref param
        if (!url.startsWith('/register?ref=')) {
          next()
          return
        }

        const refCode = new URLSearchParams(url.split('?')[1] ?? '').get('ref')?.trim().toUpperCase()
        if (!refCode) { next(); return }

        const apiBase = process.env.VITE_API_URL ?? 'http://localhost:3333'

        try {
          const resp = await fetch(`${apiBase}/api/register/meta/${encodeURIComponent(refCode)}`)
          const meta = await resp.json() as {
            ok?: boolean
            ogTitle?: string
            ogDescription?: string
            siteLogo?: string
            inviterName?: string
          }

          if (!meta?.ok) { next(); return }

          const indexPath = `${__dirname}/index.html`
          let html = fs.readFileSync(indexPath, 'utf8')

          const ogBlock = `
    <!-- OG tags for referral link -->
    <meta property="og:title" content="${escHtml(meta.ogTitle ?? 'Você foi convidado para Mancera')}" />
    <meta property="og:description" content="${escHtml(meta.ogDescription ?? 'Você recebeu um convite')}" />
    <meta property="og:image" content="${escHtml(meta.siteLogo || '/trk-banner.png')}" />
    <meta property="og:url" content="https://trk321.cc/register?ref=${refCode}" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escHtml(meta.ogTitle ?? 'Você foi convidado para Mancera')}" />
    <meta name="twitter:description" content="${escHtml(meta.ogDescription ?? 'Você recebeu um convite')}" />
    <meta name="twitter:image" content="${escHtml(meta.siteLogo || '/trk-banner.png')}" />
    <title>${escHtml(meta.ogTitle ?? 'Mancera - Registro')}</title>
`

          html = html.replace(/<title>.*?<\/title>/, '').replace('</head>', `${ogBlock}\n  </head>`)

          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          res.end(html)
        } catch {
          next()
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), ogTagsPlugin()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3333',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:3333',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  preview: {
    allowedHosts: true,
    host: '0.0.0.0',
    port: 4173,
  },
  build: {
    minify: false,
    cssMinify: false,
  },
})