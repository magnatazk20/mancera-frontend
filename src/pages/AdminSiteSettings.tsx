import { useEffect, useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import FloatingToast from '../components/FloatingToast'
import './Admin.css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

type SiteSettings = {
  siteTitle: string
  siteDescription: string
  siteLogoUrl: string
  telegramGroupLink: string
  allowUserReferralLink: boolean
  registrationRequiresInvite: boolean
  updatedAt: string | null
}

const readToken = () =>
  localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''

export default function AdminSiteSettings() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [telegramGroupLink, setTelegramGroupLink] = useState('')
  const [allowUserReferralLink, setAllowUserReferralLink] = useState(true)
  const [registrationRequiresInvite, setRegistrationRequiresInvite] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState({ open: false, type: 'success' as 'success' | 'error', message: '' })

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ open: true, type, message })
  }

  useEffect(() => {
    const load = async () => {
      try {
        const token = readToken()
        const res = await fetch(`${API_URL}/api/admin/site-settings`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const data = await res.json() as { ok?: boolean; settings?: SiteSettings; error?: string }
        if (!res.ok || !data?.ok || !data.settings) {
          showToast('error', data?.error ?? 'Falha ao carregar configurações.')
          return
        }
        const s = data.settings
        setTitle(s.siteTitle ?? '')
        setDescription(s.siteDescription ?? '')
        setLogoUrl(s.siteLogoUrl ?? '')
        setTelegramGroupLink(s.telegramGroupLink ?? '')
        setAllowUserReferralLink(s.allowUserReferralLink ?? true)
        setRegistrationRequiresInvite(s.registrationRequiresInvite ?? false)
      } catch {
        showToast('error', 'Erro de conexão ao carregar configurações.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    if (!title.trim()) {
      showToast('error', 'Título do site é obrigatório.')
      return
    }

    setSaving(true)
    try {
      const token = readToken()
      const res = await fetch(`${API_URL}/api/admin/site-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          siteTitle: title,
          siteDescription: description,
          siteLogoUrl: logoUrl,
          telegramGroupLink: telegramGroupLink,
          allowUserReferralLink,
          registrationRequiresInvite,
        }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok || !data?.ok) {
        showToast('error', data?.error ?? 'Erro ao salvar.')
        return
      }
      showToast('success', 'Configurações salvas com sucesso!')
    } catch {
      showToast('error', 'Erro de conexão ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="admin-page">
      <AdminSidebar />
      <section className="admin-content">
        <header className="admin-header">
          <div>
            <h1>⚙️ Configurações do Site</h1>
            <p className="admin-subtitle">Configure permissões e opções gerais da plataforma.</p>
          </div>
        </header>

        {loading ? (
          <p className="admin-kpi-error">Carregando...</p>
        ) : (
          <>
            <section className="admin-panel">
              <div className="admin-panel-head">
                <h2>Opções de Cadastro</h2>
                <span>Controle como usuários podem se registrar</span>
              </div>

              <div style={{ display: 'grid', gap: 16, padding: '0 0 8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={registrationRequiresInvite}
                    onChange={(e) => setRegistrationRequiresInvite(e.target.checked)}
                  />
                  <div>
                    <strong>Cadastro requer convite</strong>
                    <p style={{ margin: 0, fontSize: 12, color: '#666' }}>
                      Se ativo, novos usuários só podem se cadastrar com o link de convite de um usuário existente.
                    </p>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={allowUserReferralLink}
                    onChange={(e) => setAllowUserReferralLink(e.target.checked)}
                  />
                  <div>
                    <strong>Permitir que usuários divulguem link de convite</strong>
                    <p style={{ margin: 0, fontSize: 12, color: '#666' }}>
                      Se ativo, cada usuário pode compartilhar seu próprio link de convite para outros se cadastrarem.
                    </p>
                  </div>
                </label>
              </div>
            </section>

            <section className="admin-panel">
              <div className="admin-panel-head">
                <h2>Informações do Site</h2>
                <span>Título, descrição e links</span>
              </div>

              <div style={{ display: 'grid', gap: 14, padding: '0 0 8px' }}>
                <label style={{ display: 'grid', gap: 4 }}>
                  <strong>Título do Site</strong>
                  <input
                    className="admin-users-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: TRK Plataforma"
                  />
                </label>

                <label style={{ display: 'grid', gap: 4 }}>
                  <strong>Descrição do Site</strong>
                  <textarea
                    className="admin-users-input"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrição exibida na página inicial"
                    rows={3}
                    style={{ resize: 'vertical' }}
                  />
                </label>

                <label style={{ display: 'grid', gap: 4 }}>
                  <strong>URL do Logo</strong>
                  <input
                    className="admin-users-input"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </label>

                <label style={{ display: 'grid', gap: 4 }}>
                  <strong>Link do Grupo Telegram</strong>
                  <input
                    className="admin-users-input"
                    value={telegramGroupLink}
                    onChange={(e) => setTelegramGroupLink(e.target.value)}
                    placeholder="https://t.me/..."
                  />
                </label>
              </div>
            </section>

            <div style={{ marginTop: 16 }}>
              <button
                type="button"
                className="btn"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Salvando...' : '💾 Salvar Configurações'}
              </button>
            </div>
          </>
        )}
      </section>

      {toast.open && (
        <FloatingToast
          open={toast.open}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast((p) => ({ ...p, open: false }))}
        />
      )}
    </main>
  )
}
