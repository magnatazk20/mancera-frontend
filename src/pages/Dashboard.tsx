import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import ceoImage from '../assets/ceo.jpg'
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

type CommissionLevel = {
  id: number
  level: number
  name: string
  commissionPercent: number
  isActive: boolean
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
  const [initialStock, setInitialStock] = useState<Record<number, number>>({})
  const [selectedPlan, setSelectedPlan] = useState<CycleProduct | null>(null)
  const [isBuying, setIsBuying] = useState(false)
  const [showWelcomeModal, setShowWelcomeModal] = useState(true)
  const [commissionLevels, setCommissionLevels] = useState<CommissionLevel[]>([])
  const [modalSlide, setModalSlide] = useState(0)
  const modalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
        // Guarda estoque inicial para calcular progresso real de vendas
        const stockMap: Record<number, number> = {}
        data.products.forEach((p) => { stockMap[p.id] = Number(p.stockQuantity ?? 0) })
        setInitialStock(stockMap)
      } catch {
        // silencioso para não quebrar dashboard
      }
    }

    const loadCommissionLevels = async () => {
      try {
        const response = await fetch(`${API_URL}/api/referral/commission-levels`)
        if (!response.ok) return
        const data = (await response.json()) as { ok?: boolean; levels?: CommissionLevel[] }
        if (!data?.ok || !Array.isArray(data.levels)) return
        setCommissionLevels(data.levels)
      } catch {
        // silencioso
      }
    }

    loadSummary()
    loadCyclePlans()
    loadCommissionLevels()
  }, [user?.id])

  // timer do carrossel do modal de boas-vindas
  useEffect(() => {
    if (!showWelcomeModal) {
      if (modalTimerRef.current) clearInterval(modalTimerRef.current)
      return
    }
    const totalSlides = 1 + (commissionLevels.length > 0 ? 1 : 0)
    if (totalSlides <= 1) return
    modalTimerRef.current = setInterval(() => {
      setModalSlide((prev) => (prev + 1) % totalSlides)
    }, 4000)
    return () => {
      if (modalTimerRef.current) clearInterval(modalTimerRef.current)
    }
  }, [showWelcomeModal, commissionLevels.length])

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
      // Decrementa o estoque localmente para feedback imediato
      setCyclePlans((prev) =>
        prev.map((p) =>
          p.id === selectedPlan.id
            ? { ...p, stockQuantity: Math.max(0, Number(p.stockQuantity ?? 0) - 1) }
            : p
        )
      )
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
          <section className="welcome-banner" aria-label="Banner de boas-vindas">
            <div className="welcome-banner-track">
              <div className="welcome-banner-item">
                <img src={ceoImage} alt="CEO PGLM" className="welcome-banner-ceo" />
                <div className="welcome-banner-text-wrap">
                  <strong>{getGreeting(user.name)}</strong>
                  <span>Bem-vindo ao seu painel. Gerencie tudo com rapidez no celular.</span>
                </div>
              </div>

              <div className="welcome-banner-item">
                <img src={ceoImage} alt="CEO PGLM" className="welcome-banner-ceo" />
                <div className="welcome-banner-text-wrap">
                  <strong>Seja bem-vindo à PGLM</strong>
                  <span>Nosso CEO deseja ótimos resultados e crescimento diário na plataforma.</span>
                </div>
              </div>

              <div className="welcome-banner-item">
                <img src={ceoImage} alt="CEO PGLM" className="welcome-banner-ceo" />
                <div className="welcome-banner-text-wrap">
                  <strong>{getGreeting(user.name)}</strong>
                  <span>Bem-vindo ao seu painel. Gerencie tudo com rapidez no celular.</span>
                </div>
              </div>
            </div>
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
                  {commissionLevels.length > 0
                    ? ' ' + commissionLevels.map((lvl) => `${lvl.name}: ${Number(lvl.commissionPercent).toFixed(1)}%`).join(' • ')
                    : ' Compartilhe seu link e aumente seus ganhos!'}
                </span>
                <span className="dash-notice-sep">★</span>
                <span>
                  Convide mais amigos para entrarem na PGLM. Quanto mais pessoas você indicar, maior sua comissão.
                  {commissionLevels.length > 0
                    ? ' ' + commissionLevels.map((lvl) => `${lvl.name}: ${Number(lvl.commissionPercent).toFixed(1)}%`).join(' • ')
                    : ' Compartilhe seu link e aumente seus ganhos!'}
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
                {cyclePlans.map((plan) => {
                  const estoque = Math.max(0, Number(plan.stockQuantity ?? 0))
                  const estoqueInicial = Math.max(1, initialStock[plan.id] ?? estoque)
                  const vendidos = Math.max(0, estoqueInicial - estoque)
                  const progresso = estoqueInicial > 0 ? Math.min(100, Math.round((vendidos / estoqueInicial) * 100)) : 0
                  const compras = vendidos

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

      {showWelcomeModal ? (
        <div className="welcome-modal-backdrop" onClick={() => setShowWelcomeModal(false)}>
          <div className="welcome-modal-card" onClick={(e) => e.stopPropagation()}>

            {/* slides wrapper */}
            <div className="welcome-modal-slides">
              {/* slide 0 — boas-vindas */}
              <div
                className="welcome-modal-slide"
                style={{ transform: `translateX(${(0 - modalSlide) * 100}%)` }}
              >
                <img src={ceoImage} alt="CEO PGLM" className="welcome-modal-image" />
                <h3 className="welcome-modal-title">Bem-vindo à PGLM</h3>
                <p className="welcome-modal-text">
                  Estamos felizes por ter você aqui. Explore seu dashboard e aproveite as oportunidades da plataforma.
                </p>
              </div>

              {/* slide 1 — níveis de comissão */}
              {commissionLevels.length > 0 ? (
                <div
                  className="welcome-modal-slide"
                  style={{ transform: `translateX(${(1 - modalSlide) * 100}%)` }}
                >
                  <div className="welcome-modal-commission-icon">💰</div>
                  <h3 className="welcome-modal-title">Ganhe indicando amigos!</h3>
                  <p className="welcome-modal-text">
                    Compartilhe seu link e receba comissão por cada amigo que entrar.
                  </p>
                  <div className="welcome-modal-commission-list">
                    {commissionLevels.map((lvl) => (
                      <div key={lvl.id} className="welcome-modal-commission-row">
                        <span className="wmc-level">{lvl.name}</span>
                        <span className="wmc-percent">{Number(lvl.commissionPercent).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {/* dots */}
            {commissionLevels.length > 0 ? (
              <div className="welcome-modal-dots">
                {[0, 1].map((i) => (
                  <button
                    key={i}
                    type="button"
                    className={`welcome-modal-dot${modalSlide === i ? ' active' : ''}`}
                    onClick={() => setModalSlide(i)}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            ) : null}

            <button
              type="button"
              className="welcome-modal-btn"
              onClick={() => setShowWelcomeModal(false)}
            >
              Continuar
            </button>
          </div>
        </div>
      ) : null}
    </main>
  )
}
