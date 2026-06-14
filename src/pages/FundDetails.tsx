import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import './Dashboard.css'
import './FundDetails.css'

type StoredUser = {
  id: number
  name: string
  phone: string
}

type FundOrderItem = {
  id: number
  productName: string
  amountPaid: number
  expectedProfit: number
  cycleDays: number
  uiStatus: 'ongoing' | 'completed'
  startedAt: string | null
  endsAt: string | null
}

type OrdersResponse = {
  ok?: boolean
  orders?: Array<{
    id?: number
    productName?: string
    amountPaid?: number
    expectedProfit?: number
    cycleDays?: number
    uiStatus?: 'ongoing' | 'completed'
    startedAt?: string | null
    endsAt?: string | null
  }>
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

export default function FundDetails() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<FundOrderItem[]>([])
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
    const load = async () => {
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
          setError(data?.error ?? 'Erro ao carregar investimentos.')
          setOrders([])
          return
        }

        const mapped: FundOrderItem[] = Array.isArray(data.orders)
          ? data.orders.map((item) => ({
              id: Number(item.id ?? 0),
              productName: String(item.productName ?? 'Produto'),
              amountPaid: Number(item.amountPaid ?? 0),
              expectedProfit: Number(item.expectedProfit ?? 0),
              cycleDays: Number(item.cycleDays ?? 0),
              uiStatus: item.uiStatus === 'completed' ? 'completed' : 'ongoing',
              startedAt: item.startedAt ?? null,
              endsAt: item.endsAt ?? null,
            }))
          : []

        setOrders(mapped)
      } catch {
        setError('Erro de conexão ao carregar investimentos.')
        setOrders([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [navigate, user?.id])

  const ongoingOrders = useMemo(
    () => orders.filter((item) => item.uiStatus === 'ongoing'),
    [orders]
  )

  const completedOrders = useMemo(
    () => orders.filter((item) => item.uiStatus === 'completed'),
    [orders]
  )

  const currentInvestment = ongoingOrders[0] ?? null

  const totals = useMemo(() => {
    const invested = orders.reduce((sum, item) => sum + item.amountPaid, 0)
    const expected = orders.reduce((sum, item) => sum + item.expectedProfit, 0)
    const activeCount = ongoingOrders.length
    return { invested, expected, activeCount }
  }, [orders, ongoingOrders.length])

  return (
    <main className="dash-app">
      <section className="dash-main">
        <AppSidebar />

        <div className="dash-content">
          <div className="fund-page-header">
            <button type="button" className="fund-back-btn" onClick={() => navigate('/profile')} aria-label="Voltar">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <h1>Detalhes de Fundos</h1>
          </div>

          {!loading && !error && (
            <section className="fund-summary-grid">
              <article className="fund-summary-card">
                <span>Total Investido</span>
                <strong>{formatBRL(totals.invested)}</strong>
              </article>
              <article className="fund-summary-card">
                <span>Lucro Previsto</span>
                <strong>{formatBRL(totals.expected)}</strong>
              </article>
              <article className="fund-summary-card">
                <span>Investimentos Ativos</span>
                <strong>{totals.activeCount}</strong>
              </article>
            </section>
          )}

          {loading ? (
            <div className="fund-state-box">Carregando investimentos...</div>
          ) : error ? (
            <div className="fund-state-box">{error}</div>
          ) : orders.length === 0 ? (
            <div className="fund-state-box">Nenhum investimento encontrado.</div>
          ) : (
            <>
              <section className="fund-current-card">
                <div className="fund-current-head">
                  <h2>Investimento Atual</h2>
                  <span>{currentInvestment ? 'Ativo' : 'Sem investimento ativo'}</span>
                </div>

                {currentInvestment ? (
                  <div className="fund-grid">
                    <div>
                      <label>Produto</label>
                      <strong>{currentInvestment.productName}</strong>
                    </div>
                    <div>
                      <label>Valor investido</label>
                      <strong>{formatBRL(currentInvestment.amountPaid)}</strong>
                    </div>
                    <div>
                      <label>Lucro previsto</label>
                      <strong>{formatBRL(currentInvestment.expectedProfit)}</strong>
                    </div>
                    <div>
                      <label>Duração</label>
                      <strong>{currentInvestment.cycleDays} dias</strong>
                    </div>
                    <div>
                      <label>Período</label>
                      <strong>{formatDate(currentInvestment.startedAt)} - {formatDate(currentInvestment.endsAt)}</strong>
                    </div>
                  </div>
                ) : (
                  <p className="fund-current-empty">Você não possui investimento em andamento no momento.</p>
                )}
              </section>

              <section className="fund-category">
                <div className="fund-category-head">
                  <h3>Investimentos em andamento</h3>
                  <span>{ongoingOrders.length}</span>
                </div>

                {ongoingOrders.length === 0 ? (
                  <div className="fund-state-box">Nenhum investimento em andamento.</div>
                ) : (
                  <div className="fund-list">
                    {ongoingOrders.map((item) => (
                      <article className="fund-card" key={`ongoing-${item.id}`}>
                        <div className="fund-card-top">
                          <h3>{item.productName}</h3>
                          <span className="fund-status ongoing">Em andamento</span>
                        </div>

                        <div className="fund-grid">
                          <div>
                            <label>Valor investido</label>
                            <strong>{formatBRL(item.amountPaid)}</strong>
                          </div>
                          <div>
                            <label>Lucro previsto</label>
                            <strong>{formatBRL(item.expectedProfit)}</strong>
                          </div>
                          <div>
                            <label>Duração</label>
                            <strong>{item.cycleDays} dias</strong>
                          </div>
                          <div>
                            <label>Período</label>
                            <strong>{formatDate(item.startedAt)} - {formatDate(item.endsAt)}</strong>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="fund-category">
                <div className="fund-category-head">
                  <h3>Concluídos</h3>
                  <span>{completedOrders.length}</span>
                </div>

                {completedOrders.length === 0 ? (
                  <div className="fund-state-box">Nenhum investimento concluído.</div>
                ) : (
                  <div className="fund-list">
                    {completedOrders.map((item) => (
                      <article className="fund-card" key={`done-${item.id}`}>
                        <div className="fund-card-top">
                          <h3>{item.productName}</h3>
                          <span className="fund-status done">Concluído</span>
                        </div>

                        <div className="fund-grid">
                          <div>
                            <label>Valor investido</label>
                            <strong>{formatBRL(item.amountPaid)}</strong>
                          </div>
                          <div>
                            <label>Lucro recebido</label>
                            <strong>{formatBRL(item.expectedProfit)}</strong>
                          </div>
                          <div>
                            <label>Duração</label>
                            <strong>{item.cycleDays} dias</strong>
                          </div>
                          <div>
                            <label>Período</label>
                            <strong>{formatDate(item.startedAt)} - {formatDate(item.endsAt)}</strong>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </section>
    </main>
  )
}
