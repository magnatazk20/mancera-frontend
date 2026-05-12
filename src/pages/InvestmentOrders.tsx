import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './InvestmentOrders.css'

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

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatDate = (value: string | null) => {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('pt-BR')
}

/** Calcula o progresso de 0 a 100 baseado no tempo decorrido */
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

/** Dias restantes para encerrar o ciclo */
function calcDaysLeft(order: OrderItem): number {
  if (order.uiStatus === 'completed') return 0
  if (!order.endsAt) return order.cycleDays
  const diff = new Date(order.endsAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86_400_000))
}

/** Lucro acumulado proporcional ao progresso */
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
        setError('Erro de conexao ao carregar pedidos.')
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

  /* totais para o resumo no topo */
  const summary = useMemo(() => {
    const ongoing = orders.filter((o) => o.uiStatus === 'ongoing')
    const completed = orders.filter((o) => o.uiStatus === 'completed')
    const totalInvested = orders.reduce((s, o) => s + o.amountPaid, 0)
    const totalProfit = completed.reduce((s, o) => s + o.expectedProfit, 0)
    return { ongoing: ongoing.length, completed: completed.length, totalInvested, totalProfit }
  }, [orders])

  return (
    <div className='gradient-backdrop-shell lw-page-shell min-h-screen-safe theme-page-bg investment-orders-page'>
      <div className='lw-gradient-fx layer-one' />
      <div className='lw-gradient-fx layer-two'>
        <div className='orb orb-left' />
        <div className='orb orb-right' />
        <div className='orb orb-center' />
      </div>
      <div className='lw-gradient-fx layer-three'>
        <div className='overlay-a' />
        <div className='overlay-b' />
      </div>

      <div className='relative-content'>
        {/* header */}
        <div className='orders-sticky-header-wrap'>
          <div className='orders-sticky-header'>
            <button className='orders-back-btn' onClick={() => navigate('/profile')} type='button' aria-label='Voltar'>
              <svg viewBox='0 0 24 24' aria-hidden='true'>
                <path d='M5 12l14 0' />
                <path d='M5 12l6 6' />
                <path d='M5 12l6 -6' />
              </svg>
            </button>
            <div className='orders-title-wrap'>
              <h1><span>Fundo de Riqueza</span></h1>
            </div>
            <button
              type='button'
              className='orders-new-invest-btn'
              onClick={() => navigate('/cycle-products')}
              title='Novo investimento'
            >
              <svg viewBox='0 0 24 24' aria-hidden='true'>
                <path d='M12 5v14M5 12h14' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
              </svg>
            </button>
          </div>
        </div>

        {/* resumo de totais */}
        {!loading && !error && orders.length > 0 && (
          <div className='orders-summary-grid'>
            <div className='orders-summary-card'>
              <span className='orders-summary-label'>Em andamento</span>
              <strong className='orders-summary-value'>{summary.ongoing}</strong>
            </div>
            <div className='orders-summary-card'>
              <span className='orders-summary-label'>Concluidos</span>
              <strong className='orders-summary-value'>{summary.completed}</strong>
            </div>
            <div className='orders-summary-card'>
              <span className='orders-summary-label'>Total investido</span>
              <strong className='orders-summary-value'>{formatBRL(summary.totalInvested)}</strong>
            </div>
            <div className='orders-summary-card highlight'>
              <span className='orders-summary-label'>Lucro recebido</span>
              <strong className='orders-summary-value'>{formatBRL(summary.totalProfit)}</strong>
            </div>
          </div>
        )}

        {/* filtros */}
        <div className='orders-filters-panel'>
          <div className='orders-filters-row'>
            <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')} type='button'>
              Todos
            </button>
            <button className={filter === 'ongoing' ? 'active' : ''} onClick={() => setFilter('ongoing')} type='button'>
              Em Andamento
            </button>
            <button className={filter === 'completed' ? 'active' : ''} onClick={() => setFilter('completed')} type='button'>
              Concluido
            </button>
          </div>
        </div>

        <div className='orders-content'>
          {loading ? (
            <div className='orders-empty'>
              <div className='orders-spinner' />
              <div className='orders-empty-title'>Carregando pedidos...</div>
            </div>
          ) : error ? (
            <div className='orders-empty'>
              <div className='orders-empty-title'>{error}</div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className='orders-empty'>
              <svg viewBox='0 0 24 24' aria-hidden='true'>
                <path d='M12 3l8 4.5l0 9l-8 4.5l-8 -4.5l0 -9l8 -4.5' />
                <path d='M12 12l8 -4.5' />
                <path d='M12 12l0 9' />
                <path d='M12 12l-8 -4.5' />
                <path d='M16 5.25l-8 4.5' />
              </svg>
              <div className='orders-empty-title'>Nenhum investimento encontrado</div>
              <div className='orders-empty-subtitle'>Inicie seu primeiro investimento no Fundo de Riqueza</div>
              <button
                type='button'
                className='orders-start-btn'
                onClick={() => navigate('/cycle-products')}
              >
                Investir agora
              </button>
            </div>
          ) : (
            <div className='orders-list'>
              {filteredOrders.map((order) => {
                const progress = calcProgress(order)
                const daysLeft = calcDaysLeft(order)
                const earned = calcEarnedSoFar(order)
                const isCompleted = order.uiStatus === 'completed'

                return (
                  <article key={order.id} className={`order-card ${isCompleted ? 'order-card--done' : ''}`}>
                    {/* topo do card */}
                    <div className='order-card-top'>
                      <div className='order-card-info'>
                        <h3 className='order-card-name'>{order.productName}</h3>
                        <span className='order-card-id'>#{order.id}</span>
                      </div>
                      <span className={`order-status ${order.uiStatus}`}>
                        {isCompleted ? 'Concluido' : 'Em Andamento'}
                      </span>
                    </div>

                    {/* barra de progresso */}
                    <div className='order-progress-wrap'>
                      <div className='order-progress-header'>
                        <span className='order-progress-label'>Progresso do ciclo</span>
                        <span className='order-progress-pct'>{progress}%</span>
                      </div>
                      <div className='order-progress-track'>
                        <div
                          className={`order-progress-fill ${isCompleted ? 'done' : ''}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className='order-progress-footer'>
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

                    {/* metricas */}
                    <div className='order-metrics'>
                      <div className='order-metric'>
                        <span className='order-metric-label'>Investido</span>
                        <strong className='order-metric-value'>{formatBRL(order.amountPaid)}</strong>
                      </div>
                      <div className='order-metric'>
                        <span className='order-metric-label'>{isCompleted ? 'Lucro total' : 'Lucro acumulado'}</span>
                        <strong className={`order-metric-value ${isCompleted ? 'green' : 'cyan'}`}>
                          {formatBRL(isCompleted ? order.expectedProfit : earned)}
                        </strong>
                      </div>
                      <div className='order-metric'>
                        <span className='order-metric-label'>Lucro esperado</span>
                        <strong className='order-metric-value'>{formatBRL(order.expectedProfit)}</strong>
                      </div>
                      <div className='order-metric'>
                        <span className='order-metric-label'>Duracao</span>
                        <strong className='order-metric-value'>{order.cycleDays} dias</strong>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
