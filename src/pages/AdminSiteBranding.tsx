import { useMemo, useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import FloatingToast from '../components/FloatingToast'
import './Admin.css'

type BrandingConfig = {
  title: string
  logoUrl: string
}

const STORAGE_KEY = 'site_branding_config'
const DEFAULT_TITLE = 'PGLM Plataforma'

const readBrandingConfig = (): BrandingConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { title: DEFAULT_TITLE, logoUrl: '' }
    const parsed = JSON.parse(raw) as Partial<BrandingConfig>
    return {
      title: String(parsed.title ?? DEFAULT_TITLE).trim() || DEFAULT_TITLE,
      logoUrl: String(parsed.logoUrl ?? '').trim(),
    }
  } catch {
    return { title: DEFAULT_TITLE, logoUrl: '' }
  }
}

export default function AdminSiteBranding() {
  const current = useMemo(() => readBrandingConfig(), [])
  const [title, setTitle] = useState(current.title)
  const [logoUrl, setLogoUrl] = useState(current.logoUrl)
  const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; message: string }>({
    open: false,
    type: 'success',
    message: '',
  })

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ open: true, type, message })
  }

  const applyBranding = (cfg: BrandingConfig) => {
    document.title = cfg.title || DEFAULT_TITLE

    if (cfg.logoUrl) {
      let favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement | null
      if (!favicon) {
        favicon = document.createElement('link')
        favicon.setAttribute('rel', 'icon')
        document.head.appendChild(favicon)
      }
      favicon.setAttribute('href', cfg.logoUrl)
    }
  }

  const save = () => {
    const normalized: BrandingConfig = {
      title: title.trim() || DEFAULT_TITLE,
      logoUrl: logoUrl.trim(),
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
      applyBranding(normalized)
      showToast('success', 'Configuração de título e foto do site salva com sucesso.')
    } catch {
      showToast('error', 'Não foi possível salvar as configurações de branding.')
    }
  }

  return (
    <main className="admin-page">
      <AdminSidebar />
      <section className="admin-content admin-users-page">
        <div className="admin-card">
          <div className="admin-card-head">
            <h1>Personalização do Site</h1>
            <p>Altere o título e a foto (logo/favicon) do site inteiro.</p>
          </div>

          <div className="admin-form-grid">
            <label className="admin-input-group">
              <span>Título do site</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Minha Plataforma"
              />
            </label>

            <label className="admin-input-group">
              <span>URL da foto/logo do site</span>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://exemplo.com/logo.png"
              />
            </label>
          </div>

          <div className="admin-form-actions">
            <button type="button" onClick={save}>Salvar alterações</button>
          </div>
        </div>
      </section>

      <FloatingToast
        open={toast.open}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </main>
  )
}
