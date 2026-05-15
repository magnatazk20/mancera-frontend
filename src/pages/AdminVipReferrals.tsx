import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminSidebar from '../components/AdminSidebar'
import './Admin.css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

type VipReferralUser = {
  userId: number
  name: string
  phone: string
  vipName: string
  vipLevelId: number
  vipPrice: number
  vipStartedAt: string | null
  vipExpiresAt: string | null
  firstT1At: string | null
  invitedSinceVip: number
}

type Response = {
  ok?: boolean
  users?: VipReferralUser[]
  total?: number
  page?: number
  limit?: number
  error?: string
}

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('pt-BR')
}

const levelColor = (levelId: number) => {
  if (levelId >= 5) return '#f59e0b'
  if (levelId >= 3) return '#a78bfa'
  if (levelId >= 2) return '#60a5fa'
  return '#34d399'
}

export default function AdminVipReferrals() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [users, setUsers] = useState<VipReferralUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)
  const limit = 50

  const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''

  const loadUsers = async (pg: number, q: string) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        page: String(pg),
        limit: String(limit),
        ...(q ? { search: q } : {}),
      })
      const res = await fetch(`${API_URL}/api/admin/vip-referrals?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = (await res.json()) as Response
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? 'Falha ao carregar.')
        return
      }
      setUsers(Array.isArray(data.users) ? data.users : [])
      setTotal(data.total ?? 0)
      setPage(data.page ?? 1)
    } catch {
      setError('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers(1, '')
  }, [])

  const handleSearch = (q: string) => {
    setSearch(q)
    if (searchTimeout) clearTimeout(searchTimeout)
    const t = setTimeout(() => loadUsers(1, q), 400)
    setSearchTimeout(t)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <main className="admin-page">
      <AdminSidebar />
      <section className="admin-content admin-users-page">
        <header className="admin-header">
          <div>
            <h1>🌟 VIPs que Indicaram</h1>
            <p className="admin-subtitle">
              Usuários com VIP T1 ou superior que convidaram pelo menos uma pessoa desde que se tornaram VIP T1+.
            </p>
          </div>
          <div className="admin-header-meta">
            <span className="admin-chip">Total: {total}</span>
          </div>
        </header>

        <section className="admin-panel admin-users-panel">
          <div className="admin-panel-head">
            <h2>Buscar</h2>
          </div>
          <div className="admin-balance-adjust-grid">
            <label>
              Nome ou telefone
              <input
                className="admin-users-input"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Buscar por nome ou telefone..."
              />
            </label>
          </div>
        </section>

        {loading ? <p className="admin-kpi-error">Carregando...</p> : null}
        {error ? <p className="admin-kpi-error">{error}</p> : null}

        {!loading && !error && users.length === 0 ? (
          <section className="admin-panel">
            <p style={{ padding: '1.5rem', color: 'var(--text-muted, #888)', textAlign: 'center' }}>
              Nenhum usuário VIP T1+ com indicações desde a ativação do VIP.
            </p>
          </section>
        ) : null}

        {users.length > 0 ? (
          <>
            <section className="admin-panel admin-panel-wide">
              <div className="admin-panel-head">
                <h2>Indicações desde VIP T1+ ({total})</h2>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Usuário</th>
                      <th>VIP atual</th>
                      <th>VIP T1+ desde</th>
                      <th>VIP atual expira</th>
                      <th style={{ textAlign: 'center' }}>Convidados desde VIP</th>
                      <th>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.userId}>
                        <td>#{u.userId}</td>
                        <td>
                          <div style={{ display: 'grid', gap: 2 }}>
                            <strong>{u.name}</strong>
                            <small style={{ color: 'var(--text-muted, #888)' }}>{u.phone}</small>
                          </div>
                        </td>
                        <td>
                          <span
                            className="status"
                            style={{
                              background: `${levelColor(u.vipLevelId)}22`,
                              color: levelColor(u.vipLevelId),
                              border: `1px solid ${levelColor(u.vipLevelId)}44`,
                            }}
                          >
                            {u.vipName}
                          </span>
                        </td>
                        <td>{formatDate(u.firstT1At)}</td>
                        <td>{formatDate(u.vipExpiresAt)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <strong style={{ color: '#34d399', fontSize: 16 }}>
                            {u.invitedSinceVip}
                          </strong>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="admin-btn"
                            style={{ fontSize: 12, padding: '4px 10px' }}
                            onClick={() => navigate(`/adf/users/${u.userId}`)}
                          >
                            Ver usuário
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {totalPages > 1 ? (
              <section className="admin-panel">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '1rem' }}>
                  <button
                    type="button"
                    className="admin-btn"
                    style={{ background: '#333' }}
                    onClick={() => loadUsers(page - 1, search)}
                    disabled={page <= 1 || loading}
                  >
                    ← Anterior
                  </button>
                  <span style={{ color: 'var(--text-muted, #888)' }}>
                    Página {page} de {totalPages}
                  </span>
                  <button
                    type="button"
                    className="admin-btn"
                    style={{ background: '#333' }}
                    onClick={() => loadUsers(page + 1, search)}
                    disabled={page >= totalPages || loading}
                  >
                    Próxima →
                  </button>
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </section>
    </main>
  )
}
