import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import './Dashboard.css'

interface User {
  id: number
  name: string
  phone: string
}

type CycleProduct = {
  id: number
  name: string
  description: string
  amount: number
  profit: number
  cycleDays: number
  imageUrl: string
  isActive: boolean
  sortOrder: number
  stockQuantity?: number
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

function Icon({
  name,
  className = 'icon',
}: {
  name: 'wallet' | 'deposit' | 'check'
  className?: string
}) {
  switch (name) {
    case 'wallet':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3.5" y="6.5" width="17" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M15 10h5v4h-5a2 2 0 0 1 0-4z" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="16.8" cy="12" r="0.8" fill="currentColor" />
        </svg>
      )
    case 'deposit':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 4v12M7.5 11.5L12 16l4.5-4.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="4.5" y="18" width="15" height="2.5" rx="1" fill="currentColor" />
        </svg>
      )
    case 'check':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8 12.5l2.7 2.7L16.5 9.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    default:
      return null
  }
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [balance, setBalance] = useState(0)
  const [totalDeposits, setTotalDeposits] = useState(0)
  const [cyclePlans, setCyclePlans] = useState<CycleProduct[]>([])
  const [selectedPlan, setSelectedPlan] = useState<CycleProduct | null>(null)
  const [isBuying, setIsBuying] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token') ?? sessionStorage.getItem('token')
    const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')

    if (!token || !raw) {
      navigate('/')
      return
    }

    try {
      setUser(JSON.parse(raw) as User)
    } catch {
      navigate('/')
    }
  }, [navigate])

  useEffect(() => {
    if (!user?.id) return

    const loadSummary = async () => {
      try {
        const response = await fetch(`${API_URL}/api/user/summary/${user.id}`)
        if (!response.ok) return
        const data = (await response.json()) as { balance?: number; totalDeposits?: number }
        setBalance(Number(data.balance ?? 0))
        setTotalDeposits(Number(data.totalDeposits ?? 0))
      } catch {
        // silencioso para não quebrar dashboard
      }
    }

    const loadCyclePlans = async () => {
      try {
        const response = await fetch(`${API_URL}/api/dashboard/cycle-products`)
        if (!response.ok) return
        const data = (await response.json()) as { ok?: boolean; products?: CycleProduct[] }
        if (!data?.ok || !Array.isArray(data.products)) return
        setCyclePlans(data.products)
      } catch {
        // silencioso para não quebrar dashboard
      }
    }

    loadSummary()
    loadCyclePlans()
  }, [user?.id])

  const formatBRL = (value: number) =>
    Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const handleBuyCycle = (plan: CycleProduct) => {
    setSelectedPlan(plan)
  }

  const closePurchaseModal = () => {
    if (isBuying) return
    setSelectedPlan(null)
  }

  const formatDateTime = (date: Date) =>
    date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const confirmBuyCycle = async () => {
    if (!user?.id || !selectedPlan || isBuying) return

    setIsBuying(true)
    try {
      const response = await fetch(`${API_URL}/api/cycle-products/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          cycleProductId: selectedPlan.id,
        }),
      })

      const data = (await response.json()) as {
        ok?: boolean
        error?: string
        message?: string
        balanceAfter?: number
      }

      if (!response.ok || !data?.ok) {
        alert(data?.error ?? 'Não foi possível adquirir este ciclo.')
        return
      }

      setBalance(Number(data.balanceAfter ?? balance))
      alert(data?.message ?? 'Ciclo adquirido com sucesso.')
      setSelectedPlan(null)
    } catch {
      alert('Erro de conexão ao adquirir ciclo.')
    } finally {
      setIsBuying(false)
    }
  }

  const getGreeting = (name: string) => {
    const hour = new Date().getHours()
    if (hour >= 0 && hour < 6) return `Boa madrugada, ${name}`
    if (hour >= 6 && hour < 18) return `Bom dia, ${name}`
    return `Boa noite, ${name}`
  }

  if (!user) return null

  return (
    <main className="dash-app">
      <section className="dash-main">
        <AppSidebar />

        <div className="dash-content">
          <section className="welcome-card">
            <h1>{getGreeting(user.name)}</h1>
            <p>Bem-vindo ao seu painel. Gerencie tudo com rapidez no celular.</p>
          </section>

          <section className="dash-notice-bar" aria-label="Avisos de convite">
            <div className="dash-notice-icon-wrap">
              <svg className="dash-notice-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            </div>
            <div className="dash-notice-marquee">
              <div className="dash-notice-track">
                <span>
                  Convide mais amigos para entrarem na PGLM. Quanto mais pessoas você indicar, maior sua comissão.
                  Indicação de 1º nível: 10% • 2º nível: 3% • 3º nível: 1%. Compartilhe seu link e aumente seus ganhos!
                </span>
                <span className="dash-notice-sep">★</span>
                <span>
                  Convide mais amigos para entrarem na PGLM. Quanto mais pessoas você indicar, maior sua comissão.
                  Indicação de 1º nível: 10% • 2º nível: 3% • 3º nível: 1%. Compartilhe seu link e aumente seus ganhos!
                </span>
              </div>
            </div>
          </section>

          <section className="stats-grid">
            <article className="mini-card">
              <Icon name="wallet" className="icon-lg" />
              <h3>Saldo</h3>
              <p className="money-value">{formatBRL(balance)}</p>
            </article>
            <article className="mini-card">
              <Icon name="deposit" className="icon-lg" />
              <h3>Total de depósitos</h3>
              <p className="money-value">{formatBRL(totalDeposits)}</p>
            </article>
            <article className="mini-card">
              <Icon name="check" className="icon-lg" />
              <h3>Status da conta</h3>
              <p>Ativa / Verificada</p>
            </article>
          </section>

          <section className="landscape-actions">
            <button className="landscape-btn deposit" type="button" onClick={() => navigate('/cashin')}>
              <div className="deposit-bg-dollars" aria-hidden="true">
                <span>$</span>
                <span>$</span>
                <span>$</span>
                <span>$</span>
                <span>$</span>
                <span>$</span>
              </div>
              <span>Depositar</span>
              <div className="deposit-visual" aria-hidden="true">
                <div className="deposit-coin">💵</div>
              </div>
            </button>
            <button className="landscape-btn withdraw" type="button" onClick={() => navigate('/saque')}>
              <span>Sacar</span>
            </button>
            <button className="landscape-btn roulette" type="button" onClick={() => navigate('/roleta')}>
              <span>Roleta</span>
              <div className="roulette-visual" aria-hidden="true">
                <div className="roulette-wheel">
                  <div className="roulette-wheel-center" />
                </div>
                <div className="roulette-pointer" />
              </div>
            </button>
          </section>

          <section className="welcome-card cycle-section">
            <h1 className="cycle-section-title">Planos de ciclo</h1>
            <p className="cycle-section-subtitle">Produtos de ciclos</p>

            {cyclePlans.length === 0 ? (
              <p style={{ color: '#6b7280' }}>Nenhum plano disponível no momento.</p>
            ) : (
              <div className="cycle-plans-grid">
                {cyclePlans.map((plan, index) => {
                  const compras = Math.max(1, Math.floor((index + 1) * 2))
                  const estoque = Math.max(0, Number(plan.stockQuantity ?? 0))
                  const progresso = Math.min(95, 25 + index * 10)

                  return (
                    <article key={plan.id} className="cycle-card">
                      <img src={plan.imageUrl} alt={plan.name} className="cycle-card-image" />
                      <div className="cycle-card-body">
                        <div className="cycle-card-name">{plan.name}</div>

                        <div className="cycle-metrics-grid">
                          <div>
                            <div className="cycle-metric-value">{Math.round(plan.amount)}</div>
                            <div className="cycle-metric-label">Montante</div>
                          </div>
                          <div>
                            <div className="cycle-metric-value">{plan.cycleDays} dias</div>
                            <div className="cycle-metric-label">Ciclo</div>
                          </div>
                          <div>
                            <div className="cycle-metric-value">R${Math.round(plan.profit)}</div>
                            <div className="cycle-metric-label">Lucro</div>
                          </div>
                        </div>

                        <div className="cycle-footer">
                          <div className="cycle-stock-info">
                            <div>
                              Quantidade de Compras: <span className="cycle-stock-highlight">{compras}</span>
                            </div>
                            <div>
                              Quantidade de Estoque: <span className="cycle-stock-highlight">{estoque}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleBuyCycle(plan)}
                            className="cycle-invest-btn"
                            disabled={estoque <= 0}
                          >
                            {estoque <= 0 ? 'Esgotado' : 'Investir'}
                          </button>
                        </div>

                        <div className="cycle-progress-row">
                          <div className="cycle-progress-track">
                            <div className="cycle-progress-fill" style={{ width: `${progresso}%` }} />
                          </div>
                          <div className="cycle-progress-label">progresso {progresso}%</div>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </section>

      {selectedPlan ? (
        <div className="cycle-modal-backdrop" onClick={closePurchaseModal}>
          <div className="cycle-modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="cycle-modal-title">Confirmar investimento</h3>
            <p className="cycle-modal-subtitle">{selectedPlan.name}</p>

            <div className="cycle-modal-details">
              <div><strong>Montante:</strong> {formatBRL(selectedPlan.amount)}</div>
              <div><strong>Lucro final:</strong> {formatBRL(selectedPlan.profit)}</div>
              <div><strong>Início do ciclo:</strong> {formatDateTime(new Date())}</div>
              <div>
                <strong>Fim do ciclo:</strong>{' '}
                {formatDateTime(new Date(Date.now() + selectedPlan.cycleDays * 24 * 60 * 60 * 1000))}
              </div>
              <div><strong>Duração:</strong> {selectedPlan.cycleDays} dias</div>
            </div>

            <div className="cycle-modal-actions">
              <button
                type="button"
                onClick={closePurchaseModal}
                disabled={isBuying}
                className="cycle-modal-btn cycle-modal-btn-cancel"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmBuyCycle}
                disabled={isBuying}
                className="cycle-modal-btn cycle-modal-btn-confirm"
              >
                {isBuying ? 'Processando...' : 'Confirmar compra'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}
