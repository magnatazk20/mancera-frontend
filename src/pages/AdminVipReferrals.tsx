import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminSidebar from '../components/AdminSidebar'
import './Admin.css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

type VipReferral = {
  vipUserId: number
  vipUserName: string
  vipUserPhone: string
  vipName: string
  vipLevelId: number
  firstT1At: string | null
  vipExpiresAt: string | null
  invitedUserId: number
  invitedName: string
  invitedPhone: string
  invitedAt: string | null
  hasDeposit: boolean
}

type ApiResponse = {
  ok?: boolean
  referrals?: VipReferral[]
  total?: number
  page?: number
  limit?: number
  error?: string
}

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
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
  const [referrals, setReferrals] = useState<VipReferral[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)
  const limit = 100

  const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''

  const loadData = async (pg: number, q: string) => {
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
      const data = (await res.json()) as ApiResponse
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? 'Falha ao carregar.')
        return
      }
      setReferrals(Array.isArray(data.referrals) ? data.referrals : [])
      setTotal(data.total ?? 0)
      setPage(data.page ?? 1)
    } catch {
      setError('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(1, '')
  }, [])

  const handleSearch = (q: string) => {
    setSearch(q)
    if (searchTimeout) clearTimeout(searchTimeout)
    const t = setTimeout(() => loadData(1, q), 400)
    setSearchTimeout(t)
  }

  const totalPages = Math.ceil(total / limit)
  const depositCount = referrals.filter((r) => r.hasDeposit).length

  return (
    <main className="admin-page">
      <AdminSidebar />
      <section className="admin-content admin-users-page">
        <header className="admin-header">
          <div>
            <h1>🌟 VIPs que Indicaram</h1>
            <p className="admin-subtitle">
              Convidados por usuários VIP T1+ feitos após a ativação do VIP. Ordenado por data de cadastro (mais recente primeiro).
            </p>
          </div>
          <div className="admin-header-meta">
            <span className="admin-chip">Total de convites: {total}</span>
            <span className="admin-chip soft">Com depósito: {depositCount}</span>
            <span className="admin-chip soft" style={{ color: '#94a3b8' }}>
              Sem depósito: {referrals.length - depositCount}
            </span>
          </div>
        </header>

        <section className="admin-panel admin-users-panel">
          <div className="admin-panel-head">
            <h2>Buscar por quem indicou</h2>
          </div>
          <div className="admin-balance-adjust-grid">
            <label>
              Nome ou telefone do VIP
              <input
                className="admin-users-input"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Buscar por nome ou telefone do usuário VIP..."
              />
            </label>
          </div>
        </section>

        {loading ? <p className="admin-kpi-error">Carregando...</p> : null}
        {error ? <p className="admin-kpi-error">{error}</p> : null}

        {!loading && !error && referrals.length === 0 ? (
          <section className="admin-panel">
            <p style={{ padding: '1.5rem', color: 'var(--text-muted, #888)', textAlign: 'center' }}>
              Nenhuma indicação encontrada.
            </p>
          </section>
        ) : null}

        {referrals.length > 0 ? (
          <>
            <section className="admin-panel admin-panel-wide">
              <div className="admin-panel-head">
                <h2>Indicações ({total})</h2>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Quem indicou (VIP)</th>
                      <th>VIP ativo</th>
                      <th>VIP T1+ desde</th>
                      <th>Convidado</th>
                      <th>Data de cadastro</th>
                      <th style={{ textAlign: 'center' }}>Depositou?</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((r) => (
                      <tr key={`${r.vipUserId}-${r.invitedUserId}`}>
                        <td>
                          <div style={{ display: 'grid', gap: 2 }}>
                            <strong>#{r.vipUserId} {r.vipUserName}</strong>
                            <small style={{ color: 'var(--text-muted, #888)' }}>{r.vipUserPhone}</small>
                          </div>
                        </td>
                        <td>
                          <span
                            className="status"
                            style={{
                              background: `${levelColor(r.vipLevelId)}22`,
                              color: levelColor(r.vipLevelId),
                              border: `1px solid ${levelColor(r.vipLevelId)}44`,
                            }}
                          >
                            {r.vipName}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted, #888)' }}>
                          {formatDate(r.firstT1At)}
                        </td>
                        <td>
                          <div style={{ display: 'grid', gap: 2 }}>
                            <strong>#{r.invitedUserId} {r.invitedName}</strong>
                            <small style={{ color: 'var(--text-muted, #888)' }}>{r.invitedPhone}</small>
                          </div>
                        </td>
                        <td style={{ fontSize: 12 }}>{formatDate(r.invitedAt)}</td>
                        <td style={{ textAlign: 'center' }}>
                          {r.hasDeposit ? (
                            <span style={{
                              background: '#16a34a22',
                              color: '#16a34a',
                              border: '1px solid #16a34a44',
                              borderRadius: 6,
                              padding: '2px 8px',
                              fontSize: 12,
                              fontWeight: 600,
                            }}>
                              Sim
                            </span>
                          ) : (
                            <span style={{
                              background: '#dc262622',
                              color: '#dc2626',
                              border: '1px solid #dc262644',
                              borderRadius: 6,
                              padding: '2px 8px',
                              fontSize: 12,
                              fontWeight: 600,
                            }}>
                              Não
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="admin-btn"
                              style={{ fontSize: 11, padding: '3px 8px' }}
                              onClick={() => navigate(`/adf/users/${r.vipUserId}`)}
                            >
                              VIP
                            </button>
                            <button
                              type="button"
                              className="admin-btn"
                              style={{ fontSize: 11, padding: '3px 8px', background: '#334155' }}
                              onClick={() => navigate(`/adf/users/${r.invitedUserId}`)}
                            >
                              Convidado
                            </button>
                          </div>
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
                    onClick={() => loadData(page - 1, search)}
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
                    onClick={() => loadData(page + 1, search)}
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
