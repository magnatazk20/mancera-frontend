import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import './Dashboard.css'
import './InvestmentOrders.css'
import { API_URL } from '../utils/apiUrl'

type StoredUser = {
  id: number
  name: string
  phone: string
}

type OrderItem = {
  id: number
  userId: number
  cycleProductId: number
  productName: string
  amountPaid: number
  expectedProfit: number
  cycleDays: number
  status: string
  uiStatus: 'ongoing' | 'completed'
  startedAt: string | null
  endsAt: string | null
}

type OrdersResponse = {
  ok?: boolean
  orders?: OrderItem[]
  error?: string
}


const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatDate = (value: string | null) => {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('pt-BR')
}

function calcProgress(order: OrderItem): number {
  if (order.uiStatus === 'completed') return 100
  if (!order.startedAt || !order.endsAt) return 0
  const start = new Date(order.startedAt).getTime()
  const end = new Date(order.endsAt).getTime()
  const now = Date.now()
  if (now >= end) return 100
  if (now <= start) return 0
  return Math.round(((now - start) / (end - start)) * 100)
}

function calcDaysLeft(order: OrderItem): number {
  if (order.uiStatus === 'completed') return 0
  if (!order.endsAt) return order.cycleDays
  const diff = new Date(order.endsAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86_400_000))
}

function calcEarnedSoFar(order: OrderItem): number {
  const pct = calcProgress(order) / 100
  return Math.round(order.expectedProfit * pct * 100) / 100
}

type FilterType = 'all' | 'ongoing' | 'completed'

export default function InvestmentOrders() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [filter, setFilter] = useState<FilterType>('all')
  const [error, setError] = useState('')

  const user = useMemo(() => {
    const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')
    if (!raw) return null
    try {
      return JSON.parse(raw) as StoredUser
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    const loadOrders = async () => {
      if (!user?.id) {
        navigate('/')
        return
      }

      setLoading(true)
      setError('')

      try {
        const res = await fetch(`${API_URL}/api/cycles/orders/${user.id}`)
        const data = (await res.json()) as OrdersResponse

        if (!res.ok || !data?.ok) {
          setError(data?.error ?? 'Erro ao carregar pedidos.')
          setOrders([])
          return
        }

        setOrders(Array.isArray(data.orders) ? data.orders : [])
      } catch {
        setError('Erro de conexão ao carregar pedidos.')
        setOrders([])
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [navigate, user?.id])

  const filteredOrders = useMemo(() => {
    if (filter === 'all') return orders
    if (filter === 'ongoing') return orders.filter((o) => o.uiStatus === 'ongoing')
    return orders.filter((o) => o.uiStatus === 'completed')
  }, [filter, orders])

  const summary = useMemo(() => {
    const ongoing = orders.filter((o) => o.uiStatus === 'ongoing')
    const completed = orders.filter((o) => o.uiStatus === 'completed')
    const totalInvested = orders.reduce((s, o) => s + o.amountPaid, 0)
    const totalProfit = completed.reduce((s, o) => s + o.expectedProfit, 0)
    return { ongoing: ongoing.length, completed: completed.length, totalInvested, totalProfit }
  }, [orders])

  return (
    <main className="dash-app">
      <section className="dash-main">
        <AppSidebar />

        <div className="dash-content">
          {/* cabeçalho */}
          <div className="inv-page-header">
            <button type="button" className="inv-back-btn" onClick={() => navigate('/profile')} aria-label="Voltar">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M5 12l6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M5 12l6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <h2 className="inv-page-title">Fundo de Riqueza</h2>
            <button
              type="button"
              className="inv-new-btn"
              onClick={() => navigate('/cycle-products')}
              title="Novo investimento"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* resumo */}
          {!loading && !error && orders.length > 0 && (
            <div className="inv-summary-grid">
              <div className="inv-summary-card">
                <span className="inv-summary-label">Em andamento</span>
                <strong className="inv-summary-value">{summary.ongoing}</strong>
              </div>
              <div className="inv-summary-card">
                <span className="inv-summary-label">Concluídos</span>
                <strong className="inv-summary-value">{summary.completed}</strong>
              </div>
              <div className="inv-summary-card">
                <span className="inv-summary-label">Total investido</span>
                <strong className="inv-summary-value">{formatBRL(summary.totalInvested)}</strong>
              </div>
              <div className="inv-summary-card inv-summary-card--highlight">
                <span className="inv-summary-label">Lucro recebido</span>
                <strong className="inv-summary-value">{formatBRL(summary.totalProfit)}</strong>
              </div>
            </div>
          )}

          {/* filtros */}
          <div className="inv-filters">
            <button type="button" className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
              Todos
            </button>
            <button type="button" className={filter === 'ongoing' ? 'active' : ''} onClick={() => setFilter('ongoing')}>
              Em Andamento
            </button>
            <button type="button" className={filter === 'completed' ? 'active' : ''} onClick={() => setFilter('completed')}>
              Concluído
            </button>
          </div>

          {/* conteúdo */}
          {loading ? (
            <div className="inv-empty">
              <div className="inv-spinner" />
              <p>Carregando investimentos...</p>
            </div>
          ) : error ? (
            <div className="inv-empty">
              <p className="inv-empty-title">{error}</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="inv-empty">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="inv-empty-icon">
                <path d="M12 3l8 4.5v9l-8 4.5-8-4.5v-9L12 3z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <p className="inv-empty-title">Nenhum investimento encontrado</p>
              <p className="inv-empty-sub">Inicie seu primeiro investimento no Fundo de Riqueza</p>
              <button type="button" className="inv-start-btn" onClick={() => navigate('/cycle-products')}>
                Investir agora
              </button>
            </div>
          ) : (
            <div className="inv-list">
              {filteredOrders.map((order) => {
                const progress = calcProgress(order)
                const daysLeft = calcDaysLeft(order)
                const earned = calcEarnedSoFar(order)
                const isCompleted = order.uiStatus === 'completed'

                return (
                  <article key={order.id} className={`inv-card${isCompleted ? ' inv-card--done' : ''}`}>
                    <div className="inv-card-top">
                      <div className="inv-card-info">
                        <h3 className="inv-card-name">{order.productName}</h3>
                        <span className="inv-card-id">#{order.id}</span>
                      </div>
                      <span className={`inv-status inv-status--${order.uiStatus}`}>
                        {isCompleted ? 'Concluído' : 'Em Andamento'}
                      </span>
                    </div>

                    <div className="inv-progress-wrap">
                      <div className="inv-progress-header">
                        <span className="inv-progress-label">Progresso do ciclo</span>
                        <span className={`inv-progress-pct${isCompleted ? ' done' : ''}`}>{progress}%</span>
                      </div>
                      <div className="inv-progress-track">
                        <div
                          className={`inv-progress-fill${isCompleted ? ' done' : ''}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="inv-progress-footer">
                        <span>{formatDate(order.startedAt)}</span>
                        <span>
                          {isCompleted
                            ? 'Ciclo encerrado'
                            : daysLeft === 0
                            ? 'Encerrando hoje'
                            : `${daysLeft} dia${daysLeft !== 1 ? 's' : ''} restante${daysLeft !== 1 ? 's' : ''}`}
                        </span>
                        <span>{formatDate(order.endsAt)}</span>
                      </div>
                    </div>

                    <div className="inv-metrics">
                      <div className="inv-metric">
                        <span className="inv-metric-label">Investido</span>
                        <strong className="inv-metric-value">{formatBRL(order.amountPaid)}</strong>
                      </div>
                      <div className="inv-metric">
                        <span className="inv-metric-label">Renda diária</span>
                        <strong className="inv-metric-value">{formatBRL(order.expectedProfit / order.cycleDays)}</strong>
                      </div>
                      <div className="inv-metric">
                        <span className="inv-metric-label">{isCompleted ? 'Lucro total' : 'Lucro acumulado'}</span>
                        <strong className={`inv-metric-value${isCompleted ? ' green' : ' orange'}`}>
                          {formatBRL(isCompleted ? order.expectedProfit : earned)}
                        </strong>
                      </div>
                      <div className="inv-metric">
                        <span className="inv-metric-label">Lucro esperado</span>
                        <strong className="inv-metric-value">{formatBRL(order.expectedProfit)}</strong>
                      </div>
                      <div className="inv-metric">
                        <span className="inv-metric-label">Duração</span>
                        <strong className="inv-metric-value">{order.cycleDays} dias</strong>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
