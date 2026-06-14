import { useEffect, useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import './Admin.css'
import { API_URL } from '../utils/apiUrl'


type VipUser = {
  userId: number
  name: string
  phone: string
  vipName: string
  vipLevel: number
  vipPrice: number
  balance: number
  commissionBalance: number
  rechargeBalance: number
  vipStartedAt: string | null
  vipExpiresAt: string | null
  userCreatedAt: string | null
}

type VipUsersResponse = {
  ok?: boolean
  users?: VipUser[]
  total?: number
  page?: number
  limit?: number
  error?: string
}

const formatMoney = (value?: number | null) => {
  if (value == null || Number.isNaN(Number(value))) return '-'
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('pt-BR')
}

const levelColor = (level: number) => {
  if (level >= 5) return '#f59e0b'
  if (level >= 3) return '#a78bfa'
  if (level >= 2) return '#60a5fa'
  return '#34d399'
}

export default function AdminVipUsers() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [users, setUsers] = useState<VipUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)
  const limit = 50

  const token =
    localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''

  const loadUsers = async (pg: number, q: string) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        page: String(pg),
        limit: String(limit),
        ...(q ? { search: q } : {}),
      })
      const res = await fetch(`${API_URL}/api/admin/vip-users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = (await res.json()) as VipUsersResponse
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

  const totals = users.reduce(
    (acc, u) => ({
      balance: acc.balance + u.balance,
      commissionBalance: acc.commissionBalance + u.commissionBalance,
      rechargeBalance: acc.rechargeBalance + u.rechargeBalance,
    }),
    { balance: 0, commissionBalance: 0, rechargeBalance: 0 }
  )

  return (
    <main className="admin-page">
      <AdminSidebar />
      <section className="admin-content admin-users-page">
        <header className="admin-header">
          <div>
            <h1>👑 Usuários VIP</h1>
            <p className="admin-subtitle">
              Lista de todos os usuários com VIP ativo purchased, com saldo de conta, comissão e recarga.
            </p>
          </div>
          <div className="admin-header-meta">
            <span className="admin-chip">Total: {total}</span>
            <span className="admin-chip soft">
              Saldo total: {formatMoney(totals.balance)}
            </span>
            <span className="admin-chip soft">
              Comissão: {formatMoney(totals.commissionBalance)}
            </span>
            <span className="admin-chip soft">
              Recarga: {formatMoney(totals.rechargeBalance)}
            </span>
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
              Nenhum usuário VIP encontrado.
            </p>
          </section>
        ) : null}

        {users.length > 0 ? (
          <>
            <section className="admin-panel admin-panel-wide">
              <div className="admin-panel-head">
                <h2>Lista de Usuários VIP ({total})</h2>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Usuário</th>
                      <th>VIP</th>
                      <th>Saldo Conta</th>
                      <th>Saldo Comissão</th>
                      <th>Saldo Recarga</th>
                      <th>VIP desde</th>
                      <th>Expira em</th>
                      <th>Cadastro</th>
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
                              background: `${levelColor(u.vipLevel)}22`,
                              color: levelColor(u.vipLevel),
                              border: `1px solid ${levelColor(u.vipLevel)}44`,
                            }}
                          >
                            {u.vipName}
                          </span>
                        </td>
                        <td style={{ color: '#34d399', fontWeight: 600 }}>
                          {formatMoney(u.balance)}
                        </td>
                        <td style={{ color: '#60a5fa', fontWeight: 600 }}>
                          {formatMoney(u.commissionBalance)}
                        </td>
                        <td style={{ color: '#f59e0b', fontWeight: 600 }}>
                          {formatMoney(u.rechargeBalance)}
                        </td>
                        <td>{formatDate(u.vipStartedAt)}</td>
                        <td>{formatDate(u.vipExpiresAt)}</td>
                        <td>{formatDate(u.userCreatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <td colSpan={3} style={{ fontWeight: 'bold' }}>TOTAL</td>
                      <td style={{ color: '#34d399', fontWeight: 'bold' }}>{formatMoney(totals.balance)}</td>
                      <td style={{ color: '#60a5fa', fontWeight: 'bold' }}>{formatMoney(totals.commissionBalance)}</td>
                      <td style={{ color: '#f59e0b', fontWeight: 'bold' }}>{formatMoney(totals.rechargeBalance)}</td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
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