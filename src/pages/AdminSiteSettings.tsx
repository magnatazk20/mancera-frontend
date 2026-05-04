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

type UserRow = {
  id: number
  name: string
  phone: string
  allow_referral_link: number
}

const readToken = () =>
  localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''

export default function AdminSiteSettings() {
  const [registrationRequiresInvite, setRegistrationRequiresInvite] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [users, setUsers] = useState<UserRow[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [toggling, setToggling] = useState<number | null>(null)
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
        setRegistrationRequiresInvite(s.registrationRequiresInvite ?? false)
      } catch {
        showToast('error', 'Erro de conexão ao carregar configurações.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (loading) return
    const loadUsers = async () => {
      setLoadingUsers(true)
      try {
        const token = readToken()
        const res = await fetch(`${API_URL}/api/admin/users`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const data = await res.json() as { ok?: boolean; users?: UserRow[] }
        if (data?.ok && Array.isArray(data.users)) {
          setUsers(data.users)
        }
      } catch { /* silencioso */ }
      finally { setLoadingUsers(false) }
    }
    loadUsers()
  }, [loading])

  const handleSave = async () => {
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
          siteTitle: 'TRK',
          siteDescription: 'TRK',
          siteLogoUrl: '',
          telegramGroupLink: '',
          allowUserReferralLink: true,
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

  const toggleReferralLink = async (userId: number, currentValue: number) => {
    setToggling(userId)
    try {
      const token = readToken()
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/referral-link`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ allow_referral_link: currentValue ? 0 : 1 }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok || !data?.ok) {
        showToast('error', data?.error ?? 'Erro ao alterar.')
        return
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, allow_referral_link: currentValue ? 0 : 1 } : u
        )
      )
    } catch {
      showToast('error', 'Erro de conexão.')
    } finally {
      setToggling(null)
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

            <section className="admin-panel admin-panel-wide" style={{ marginTop: 24 }}>
              <div className="admin-panel-head">
                <h2>Permissão de Link de Convite por Usuário</h2>
                <span>Ative ou desative individualmente para cada usuário</span>
              </div>

              {loadingUsers ? (
                <p className="admin-kpi-error">Carregando usuários...</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Nome</th>
                        <th>Telefone</th>
                        <th>Link de Convite</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td>#{u.id}</td>
                          <td>{u.name}</td>
                          <td>{u.phone}</td>
                          <td>
                            <button
                              type="button"
                              className={`btn ${u.allow_referral_link ? 'paid' : 'pending'}`}
                              style={{ minWidth: 90 }}
                              onClick={() => toggleReferralLink(u.id, u.allow_referral_link)}
                              disabled={toggling === u.id}
                            >
                              {toggling === u.id ? '...' : u.allow_referral_link ? 'Ativado' : 'Desativado'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
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
