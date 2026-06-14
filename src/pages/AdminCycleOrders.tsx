import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminSidebar from '../components/AdminSidebar'
import './Admin.css'
import './AdminCycleOrders.css'
import { API_URL } from '../utils/apiUrl'


const formatBRL = (v: number) =>
  Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatDate = (v?: string | null) => {
  if (!v) return '-'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString('pt-BR')
}

type CycleOrder = {
  id: number
  userId: number
  userName: string
  userPhone: string
  productName: string
  amountPaid: number
  expectedProfit: number
  cycleDays: number
  status: string
  uiStatus: 'ongoing' | 'completed' | 'expired'
  startedAt: string | null
  endsAt: string | null
}

const STATUS_TABS = [
  { key: 'all', label: 'Todos' },
  { key: 'active', label: 'Em Andamento' },
  { key: 'expired', label: 'Expirados' },
  { key: 'completed', label: 'Concluídos' },
] as const

type StatusKey = typeof STATUS_TABS[number]['key']

export default function AdminCycleOrders() {
  const navigate = useNavigate()
  const token = useMemo(
    () => localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? '',
    []
  )

  const [statusTab, setStatusTab] = useState<StatusKey>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [orders, setOrders] = useState<CycleOrder[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const params = new URLSearchParams({ status: statusTab })
        if (search.trim()) params.set('search', search.trim())

        const res = await fetch(`${API_URL}/api/admin/cycles/all?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = (await res.json()) as { ok?: boolean; orders?: CycleOrder[]; error?: string }

        if (!res.ok || !data.ok) {
          setError(data.error ?? 'Falha ao carregar ciclos.')
          return
        }
        setOrders(Array.isArray(data.orders) ? data.orders : [])
      } catch {
        setError('Erro de conexão ao carregar ciclos.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [statusTab, search, token])

  const summary = useMemo(() => {
    const ongoing = orders.filter((o) => o.uiStatus === 'ongoing').length
    const completed = orders.filter((o) => o.uiStatus === 'completed').length
    const expired = orders.filter((o) => o.uiStatus === 'expired').length
    const totalInvested = orders.reduce((s, o) => s + o.amountPaid, 0)
    const totalProfit = orders.reduce((s, o) => s + o.expectedProfit, 0)
    return { ongoing, completed, expired, totalInvested, totalProfit }
  }, [orders])

  const uiStatusLabel = (uiStatus: CycleOrder['uiStatus']) => {
    if (uiStatus === 'completed') return 'Concluído'
    if (uiStatus === 'expired') return 'Expirado'
    return 'Em Andamento'
  }

  const uiStatusClass = (uiStatus: CycleOrder['uiStatus']) => {
    if (uiStatus === 'completed') return 'aco-badge--completed'
    if (uiStatus === 'expired') return 'aco-badge--expired'
    return 'aco-badge--ongoing'
  }

  return (
    <main className="admin-page">
      <AdminSidebar />
      <section className="admin-content">
        <header className="admin-header">
          <div>
            <h1>Ciclos — Todos os Pedidos</h1>
            <p className="admin-subtitle">
              Visualize e filtre os ciclos de investimento de todos os usuários.
            </p>
          </div>
        </header>

        {/* Summary */}
        <div className="aco-summary">
          <div className="aco-summary-card">
            <span className="aco-summary-label">Em Andamento</span>
            <strong className="aco-summary-value aco-c-orange">{summary.ongoing}</strong>
          </div>
          <div className="aco-summary-card">
            <span className="aco-summary-label">Expirados</span>
            <strong className="aco-summary-value aco-c-red">{summary.expired}</strong>
          </div>
          <div className="aco-summary-card">
            <span className="aco-summary-label">Concluídos</span>
            <strong className="aco-summary-value aco-c-green">{summary.completed}</strong>
          </div>
          <div className="aco-summary-card">
            <span className="aco-summary-label">Total Investido</span>
            <strong className="aco-summary-value">{formatBRL(summary.totalInvested)}</strong>
          </div>
          <div className="aco-summary-card">
            <span className="aco-summary-label">Lucro Esperado Total</span>
            <strong className="aco-summary-value aco-c-green">{formatBRL(summary.totalProfit)}</strong>
          </div>
        </div>

        {/* Filters */}
        <div className="aco-filters">
          <div className="aco-tabs">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`aco-tab${statusTab === tab.key ? ' active' : ''}`}
                onClick={() => setStatusTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <input
            className="aco-search"
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Error */}
        {error ? <p className="aco-error">{error}</p> : null}

        {/* Table */}
        <div className="admin-table-wrap">
          {loading ? (
            <div className="aco-loading">Carregando ciclos...</div>
          ) : orders.length === 0 ? (
            <div className="aco-empty">Nenhum ciclo encontrado.</div>
          ) : (
            <table className="admin-table aco-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Usuário</th>
                  <th>Produto</th>
                  <th>Investido</th>
                  <th>Lucro Esp.</th>
                  <th>Dias</th>
                  <th>Status</th>
                  <th>Início</th>
                  <th>Fim</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>
                      <div className="aco-user-cell">
                        <span className="aco-user-name">{order.userName || `#${order.userId}`}</span>
                        <span className="aco-user-phone">{order.userPhone}</span>
                      </div>
                    </td>
                    <td>{order.productName}</td>
                    <td>{formatBRL(order.amountPaid)}</td>
                    <td className="aco-c-green">{formatBRL(order.expectedProfit)}</td>
                    <td>{order.cycleDays}d</td>
                    <td>
                      <span className={`aco-badge ${uiStatusClass(order.uiStatus)}`}>
                        {uiStatusLabel(order.uiStatus)}
                      </span>
                    </td>
                    <td>{formatDate(order.startedAt)}</td>
                    <td>{formatDate(order.endsAt)}</td>
                    <td>
                      <button
                        type="button"
                        className="aco-user-btn"
                        onClick={() => navigate(`/adf/users/${order.userId}`)}
                      >
                        Ver usuário
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Mobile cards */}
        <div className="aco-cards">
          {!loading && orders.map((order) => (
            <article key={`card-${order.id}`} className="aco-card">
              <div className="aco-card-head">
                <div>
                  <strong className="aco-user-name">{order.userName || `Usuário #${order.userId}`}</strong>
                  <small className="aco-user-phone">{order.userPhone}</small>
                </div>
                <span className={`aco-badge ${uiStatusClass(order.uiStatus)}`}>
                  {uiStatusLabel(order.uiStatus)}
                </span>
              </div>
              <div className="aco-card-body">
                <div className="aco-card-row"><span>Produto</span><span>{order.productName}</span></div>
                <div className="aco-card-row"><span>Investido</span><span>{formatBRL(order.amountPaid)}</span></div>
                <div className="aco-card-row"><span>Lucro Esperado</span><span className="aco-c-green">{formatBRL(order.expectedProfit)}</span></div>
                <div className="aco-card-row"><span>Duração</span><span>{order.cycleDays} dias</span></div>
                <div className="aco-card-row"><span>Início</span><span>{formatDate(order.startedAt)}</span></div>
                <div className="aco-card-row"><span>Fim</span><span>{formatDate(order.endsAt)}</span></div>
              </div>
              <button
                type="button"
                className="aco-user-btn aco-user-btn--full"
                onClick={() => navigate(`/adf/users/${order.userId}`)}
              >
                Ver usuário #{order.userId}
              </button>
            </article>
          ))}
        </div>

        {!loading && orders.length > 0 ? (
          <p className="aco-count">Exibindo {orders.length} registro(s)</p>
        ) : null}
      </section>
    </main>
  )
}
