import { useEffect, useMemo, useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import './Admin.css'

type DepositRow = {
  id: number
  userId: number
  amount: number
  method: string
  status: string
  providerTransactionId: string | null
  createdAt: string | null
  paidAt: string | null
  user: {
    id: number
    name: string
    phone: string
  }
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('pt-BR')
}

export default function AdminDeposits() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deposits, setDeposits] = useState<DepositRow[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | 'paid' | 'pending' | 'processing' | 'failed'>('all')

  const filteredDeposits = useMemo(() => {
    const term = search.trim().toLowerCase()

    return deposits.filter((item) => {
      const normalizedStatus = String(item.status ?? '').toLowerCase()
      const matchesStatus = status === 'all' ? true : normalizedStatus === status

      const matchesTerm = !term
        ? true
        : String(item.id).includes(term) ||
          String(item.userId).includes(term) ||
          String(item.user?.name ?? '').toLowerCase().includes(term) ||
          String(item.user?.phone ?? '').toLowerCase().includes(term) ||
          String(item.providerTransactionId ?? '').toLowerCase().includes(term)

      return matchesStatus && matchesTerm
    })
  }, [deposits, search, status])

  const fetchDeposits = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token') ?? sessionStorage.getItem('token')
      const query = new URLSearchParams()
      query.set('limit', '300')
      query.set('status', status)
      if (search.trim()) query.set('search', search.trim())

      const response = await fetch(`${API_URL}/api/admin/deposits?${query.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data?.ok) {
        setError(String(data?.error ?? 'Não foi possível carregar entradas de pagamentos.'))
        setDeposits([])
        return
      }

      setDeposits(Array.isArray(data.deposits) ? data.deposits : [])
    } catch {
      setError('Falha de conexão ao carregar entradas de pagamentos.')
      setDeposits([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeposits()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  return (
    <main className="admin-page">
      <AdminSidebar />
      <section className="admin-content admin-users-page">
        <header className="admin-header">
          <div>
            <h1>Entradas de Pagamentos</h1>
            <p className="admin-subtitle">Visualize depósitos pagos e pendentes dos usuários.</p>
          </div>
        </header>

        <section className="admin-panel admin-panel-wide">
          <div className="admin-panel-head">
            <h2>Depósitos</h2>
            <span>total: {filteredDeposits.length}</span>
          </div>

          <div className="admin-withdraw-filters">
            <div className="admin-withdraw-filter-field admin-withdraw-filter-search">
              <label htmlFor="deposit-search">Busca</label>
              <input
                id="deposit-search"
                type="text"
                className="admin-withdraw-filter-input"
                placeholder="ID, usuário, telefone ou txId"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="admin-withdraw-filter-field">
              <label htmlFor="deposit-status">Status</label>
              <select
                id="deposit-status"
                className="admin-withdraw-filter-input"
                value={status}
                onChange={(event) => setStatus(event.target.value as 'all' | 'paid' | 'pending' | 'processing' | 'failed')}
              >
                <option value="all">Todos</option>
                <option value="paid">Pago</option>
                <option value="pending">Pendente</option>
                <option value="processing">Processando</option>
                <option value="failed">Falhou</option>
              </select>
            </div>

            <div className="admin-withdraw-filter-actions">
              <button type="button" className="btn primary" onClick={fetchDeposits}>
                Atualizar
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  setSearch('')
                  setStatus('all')
                }}
              >
                Limpar filtros
              </button>
            </div>
          </div>

          {loading ? <p className="admin-log-hint">Carregando depósitos...</p> : null}
          {!loading && error ? <p className="admin-log-hint">{error}</p> : null}
          {!loading && !error && filteredDeposits.length === 0 ? (
            <p className="admin-log-hint">Nenhum depósito encontrado.</p>
          ) : null}

          {!loading && !error && filteredDeposits.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Usuário</th>
                    <th>Telefone</th>
                    <th>Valor</th>
                    <th>Método</th>
                    <th>Status</th>
                    <th>TxId</th>
                    <th>Criado em</th>
                    <th>Pago em</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeposits.map((item) => (
                    <tr key={item.id}>
                      <td>#{item.id}</td>
                      <td>{item.user?.name ?? '-'}</td>
                      <td>{item.user?.phone ?? '-'}</td>
                      <td>{formatBRL(item.amount)}</td>
                      <td>{String(item.method ?? 'pix').toUpperCase()}</td>
                      <td>{String(item.status ?? 'pending').toUpperCase()}</td>
                      <td>{item.providerTransactionId ?? '-'}</td>
                      <td>{formatDate(item.createdAt)}</td>
                      <td>{formatDate(item.paidAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  )
}
