import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import VipHeader from '../components/VipHeader'
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

// Paleta de cores por badge (escudo com gradiente e detalhe)
const BADGE_STYLES: Record<string, { fill: string; stroke: string; accent: string }> = {
  'Estagiário':  { fill: '#b8c5d1', stroke: '#6f7e8d', accent: '#3d4a58' },
  'Júnior':      { fill: '#7dd6a7', stroke: '#2f8a5b', accent: '#155235' },
  'Junior':      { fill: '#7dd6a7', stroke: '#2f8a5b', accent: '#155235' },
  'Pleno':       { fill: '#5eb6ff', stroke: '#1f6fb2', accent: '#0b3e66' },
  'Sênior':      { fill: '#c7a8ff', stroke: '#6f45c9', accent: '#3c1f7b' },
  'Senior':      { fill: '#c7a8ff', stroke: '#6f45c9', accent: '#3c1f7b' },
  'Especialista':{ fill: '#ffcf6b', stroke: '#d39317', accent: '#6e4a07' },
  'Mestre':      { fill: '#ff8a5e', stroke: '#c35318', accent: '#6d2a05' },
  'Lenda':       { fill: '#ff5e87', stroke: '#c02556', accent: '#6d0d2c' },
}

function BadgeShield({ badge, className = 'badge-shield' }: { badge: string; className?: string }) {
  const style = BADGE_STYLES[badge] ?? BADGE_STYLES['Estagiário']
  return (
    <svg className={className} viewBox="0 0 24 28" aria-hidden="true">
      <defs>
        <linearGradient id={`shield-g-${badge}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={style.fill} />
          <stop offset="100%" stopColor={style.stroke} />
        </linearGradient>
      </defs>
      <path
        d="M12 1 L22 4 V13 C22 19 17.5 24.5 12 27 C6.5 24.5 2 19 2 13 V4 Z"
        fill={`url(#shield-g-${badge})`}
        stroke={style.stroke}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M8 13 L11 16 L16 10"
        fill="none"
        stroke={style.accent}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

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
  const [badge, setBadge] = useState<string>('Estagiário')
  const [, setCyclePlans] = useState<CycleProduct[]>([])
  const [, setInitialStock] = useState<Record<number, number>>({})
  const [selectedPlan, setSelectedPlan] = useState<CycleProduct | null>(null)
  const [isBuying, setIsBuying] = useState(false)
  const [showWelcomeModal, setShowWelcomeModal] = useState(true)
  const [commissionLevels, setCommissionLevels] = useState<CommissionLevel[]>([])
  const [modalSlide, setModalSlide] = useState(0)
  const modalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Envelope Vermelho (resgate de código)
  const [envelopeOpen, setEnvelopeOpen] = useState(false)
  const [envelopeCode, setEnvelopeCode] = useState('')
  const [envelopeLoading, setEnvelopeLoading] = useState(false)
  const [envelopeFeedback, setEnvelopeFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleRedeemEnvelope = async () => {
    if (!user?.id) {
      setEnvelopeFeedback({ type: 'error', message: 'Usuário não autenticado.' })
      return
    }
    const normalized = envelopeCode.trim().toUpperCase()
    if (!normalized) {
      setEnvelopeFeedback({ type: 'error', message: 'Informe o código.' })
      return
    }

    setEnvelopeLoading(true)
    const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''
    try {
      const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'
      const res = await fetch(`${apiUrl}/api/gift-codes/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId: user.id, code: normalized }),
      })
      const data = await res.json().catch(() => ({})) as {
        ok?: boolean
        error?: string
        message?: string
        rewardValue?: number
      }
      if (!res.ok || !data?.ok) {
        setEnvelopeFeedback({ type: 'error', message: data?.error ?? 'Não foi possível resgatar o código.' })
        return
      }
      const reward = Number(data?.rewardValue ?? 0)
      const successMsg = data?.message ?? (reward > 0
        ? `Código resgatado! Você recebeu ${reward.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`
        : 'Código resgatado com sucesso.')
      setEnvelopeFeedback({ type: 'success', message: successMsg })
      setEnvelopeCode('')
    } catch {
      setEnvelopeFeedback({ type: 'error', message: 'Erro de conexão ao resgatar código.' })
    } finally {
      setEnvelopeLoading(false)
    }
  }

  const closeEnvelopeModal = () => {
    setEnvelopeOpen(false)
    setEnvelopeCode('')
    setEnvelopeFeedback(null)
  }

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
        const data = (await response.json()) as { balance?: number; totalDeposits?: number; badge?: string }
        setBalance(Number(data.balance ?? 0))
        setTotalDeposits(Number(data.totalDeposits ?? 0))
        // Badge não vem mais daqui — é determinado por loadActiveVip
      } catch {
        // silencioso para não quebrar dashboard
      }
    }

    const loadActiveVip = async () => {
      try {
        const response = await fetch(`${API_URL}/api/vip/user/${user.id}`)
        if (!response.ok) {
          setBadge('Estagiário')
          return
        }
        const data = (await response.json()) as {
          ok?: boolean
          hasVip?: boolean
          vip?: { levelName?: string } | null
        }
        if (data?.ok && data.hasVip && data.vip?.levelName) {
          setBadge(String(data.vip.levelName))
        } else {
          setBadge('Estagiário')
        }
      } catch {
        setBadge('Estagiário')
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
    loadActiveVip()
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
    const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''
    try {
      const response = await fetch(`${API_URL}/api/cycle-products/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
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
          <section className="trk-banner" aria-label="Banner TRK">
            <div className="trk-banner__bg" aria-hidden="true">
              <span className="trk-banner__glow trk-banner__glow--1" />
              <span className="trk-banner__glow trk-banner__glow--2" />
              <span className="trk-banner__coin trk-banner__coin--a">R$</span>
              <span className="trk-banner__coin trk-banner__coin--b">R$</span>
              <span className="trk-banner__coin trk-banner__coin--c">R$</span>
              <svg className="trk-banner__football" viewBox="0 0 64 64" fill="none" aria-hidden="true">
                <circle cx="32" cy="32" r="30" stroke="rgba(255,255,255,0.22)" strokeWidth="2" fill="rgba(255,255,255,0.08)" />
                <path d="M32 2a30 30 0 0 1 0 60A30 30 0 0 1 32 2z" fill="none" />
                <polygon points="32,10 38,20 48,22 42,32 44,44 32,40 20,44 22,32 16,22 26,20" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" fill="rgba(255,255,255,0.06)" strokeLinejoin="round" />
                <polygon points="32,10 38,20 26,20" fill="rgba(255,255,255,0.18)" />
                <polygon points="48,22 42,32 38,20" fill="rgba(255,255,255,0.18)" />
                <polygon points="44,44 32,40 42,32" fill="rgba(255,255,255,0.18)" />
                <polygon points="20,44 22,32 32,40" fill="rgba(255,255,255,0.18)" />
                <polygon points="16,22 26,20 22,32" fill="rgba(255,255,255,0.18)" />
              </svg>
            </div>

            <div className="trk-banner__content">
              <button type="button" className="trk-banner__notif-btn" aria-label="Notificações">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span className="trk-banner__notif-dot" />
              </button>
              <span className="trk-banner__badge">
                <BadgeShield badge={badge} className="trk-banner__badge-icon" />
                {badge}
              </span>
              <h2 className="trk-banner__logo">TRK</h2>
              <p className="trk-banner__tagline">
                Sua rotina de tarefas que vira dinheiro
              </p>
              <p className="trk-banner__desc">
                Faça as tarefas diárias, assista aos mini vídeos e receba
                direto no seu saldo. Rápido, seguro e feito para o celular.
              </p>
            </div>
          </section>

          <section className="home-actions-row" aria-label="Ações principais">
            <button
              type="button"
              className="home-action home-action--recarga"
              onClick={() => navigate('/cashin')}
            >
              <span>Recarga</span>
            </button>
            <button
              type="button"
              className="home-action home-action--saque"
              onClick={() => navigate('/saque')}
            >
              <span>Saque</span>
            </button>
          </section>

          <section className="menu-grid" aria-label="Ações rápidas">
            <button type="button" className="menu-grid__item" onClick={() => navigate('/cashin')}>
              <div className="menu-grid__icon menu-grid__icon--deposit" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="#ff8a03" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="6" width="18" height="13" rx="2.5" />
                  <path d="M3 10h18" />
                  <path d="M12 13v4M10 15h4" />
                </svg>
              </div>
              <span className="menu-grid__label">Depositar</span>
            </button>

            <button type="button" className="menu-grid__item" onClick={() => navigate('/saque')}>
              <div className="menu-grid__icon menu-grid__icon--withdraw" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="#ff8a03" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v12" />
                  <path d="M7 10l5 5 5-5" />
                  <path d="M4 19h16" />
                </svg>
              </div>
              <span className="menu-grid__label">Sacar</span>
            </button>

            <button type="button" className="menu-grid__item" onClick={() => navigate('/roleta')}>
              <div className="menu-grid__icon menu-grid__icon--roulette" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="#ff8a03" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="13" r="8" />
                  <path d="M12 5v16M4 13h16M6.3 7.3l11.4 11.4M17.7 7.3L6.3 18.7" />
                  <circle cx="12" cy="13" r="1.6" fill="#ff8a03" stroke="none" />
                  <path d="M12 2l-2 3h4l-2-3z" fill="#ff8a03" stroke="none" />
                </svg>
              </div>
              <span className="menu-grid__label">LUCKY WHEEL</span>
            </button>

            <button type="button" className="menu-grid__item" onClick={() => navigate('/tasks')}>
              <div className="menu-grid__icon menu-grid__icon--tasks" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="#ff8a03" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="1" />
                  <path d="M9 14l2 2 4-4" />
                </svg>
              </div>
              <span className="menu-grid__label">Trabalho</span>
            </button>

            <button
              type="button"
              className="menu-grid__item"
              onClick={() => navigate('/introducao')}
            >
              <div className="menu-grid__icon menu-grid__icon--intro" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="#ff8a03" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21V7a2 2 0 0 1 2-2h8l6 6v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <path d="M13 5v5h5" />
                  <path d="M8 14h8M8 17h5" />
                </svg>
              </div>
              <span className="menu-grid__label">Introdução da empresa</span>
            </button>

            <button
              type="button"
              className="menu-grid__item"
              onClick={() => setEnvelopeOpen(true)}
            >
              <div className="menu-grid__icon menu-grid__icon--envelope" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="#ff8a03" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 7l9 6 9-6" />
                  <circle cx="12" cy="13" r="2" fill="#ff8a03" stroke="none" />
                </svg>
              </div>
              <span className="menu-grid__label">Envelope Vermelho</span>
            </button>

            <button
              type="button"
              className="menu-grid__item"
              onClick={() => navigate('/cycle-products')}
            >
              <div className="menu-grid__icon menu-grid__icon--fundo" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="#ff8a03" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="menu-grid__label">Fundo de Riqueza</span>
            </button>

            <button
              type="button"
              className="menu-grid__item"
              onClick={() => navigate('/salario-mensal')}
            >
              <div className="menu-grid__icon menu-grid__icon--salary" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="#ff8a03" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="6" width="20" height="14" rx="2" />
                  <path d="M2 10h20" />
                  <circle cx="12" cy="16" r="2" />
                  <path d="M6 2v4M18 2v4" />
                </svg>
              </div>
              <span className="menu-grid__label">Salário Mensal</span>
            </button>

            <button
              type="button"
              className="menu-grid__item"
              onClick={() => navigate('/team-expansion')}
            >
              <div className="menu-grid__icon menu-grid__icon--expansion" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="#ff8a03" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <span className="menu-grid__label">Expansão da Equipe</span>
            </button>
          </section>

          <section className="platform-rules-card" aria-label="Como funciona a plataforma">
            <h2 className="platform-rules-card__title">Trabalho e Lucro na TRK</h2>
            <p className="platform-rules-card__lead">
              Na TRK, o seu esforço se transforma em lucro real. Complete seus
              trabalhos diários e veja seus rendimentos crescerem a cada dia.
              Realize os trabalhos disponíveis e assista aos mini vídeos para
              liberar seus ganhos. Quanto mais trabalhos você concluir no dia,
              maior o seu lucro acumulado. Cada trabalho concluído gera comissão
              direta na sua conta — trabalhe, lucre e saque! Os saques estão
              disponíveis de segunda a sábado, das 11:00 às 19:00, com valor
              mínimo de R$ 30,00.
            </p>
          </section>

          <section className="trk-story" aria-label="História da TRK">
            <header className="trk-story__header">
              <h2 className="trk-story__title">Conheça a TRK</h2>
              <p className="trk-story__subtitle">
                Nossa história, nosso time e o lugar onde tudo acontece
              </p>
            </header>

            <article className="trk-story__card">
              <div className="trk-story__image-wrap">
                <img
                  src="/trk-team-1.png"
                  alt="Equipe TRK trabalhando em conjunto"
                  className="trk-story__image"
                  loading="lazy"
                />
              </div>
              <div className="trk-story__body">
                <h3>Um time que acredita em você</h3>
                <p>
                  A TRK nasceu da ideia de transformar tempo livre em renda
                  real. Nossa equipe trabalha todos os dias para criar
                  tarefas simples, rápidas e acessíveis, para que qualquer
                  pessoa possa ganhar dinheiro pelo celular.
                </p>
              </div>
            </article>

            <article className="trk-story__card">
              <div className="trk-story__image-wrap">
                <img
                  src="/trk-team-2.png"
                  alt="Escritório moderno da TRK"
                  className="trk-story__image"
                  loading="lazy"
                />
              </div>
              <div className="trk-story__body">
                <h3>Um escritório feito para crescer</h3>
                <p>
                  No nosso espaço, tecnologia e pessoas caminham juntas.
                  É aqui que a plataforma TRK é construída, monitorada e
                  evoluída para garantir pagamentos rápidos, segurança e
                  novas oportunidades todos os dias.
                </p>
              </div>
            </article>

            <article className="trk-story__card">
              <div className="trk-story__image-wrap">
                <img
                  src="/trk-team-1.png"
                  alt="Equipe TRK em reunião"
                  className="trk-story__image"
                  loading="lazy"
                />
              </div>
              <div className="trk-story__body">
                <h3>Reuniões que viram resultados</h3>
                <p>
                  Cada nova funcionalidade passa por um time dedicado de
                  produto, tecnologia e suporte. Estamos sempre ouvindo
                  nossos usuários para entregar uma plataforma cada vez
                  melhor e mais justa.
                </p>
              </div>
            </article>

            <article className="trk-story__card">
              <div className="trk-story__image-wrap">
                <img
                  src="/trk-team-2.png"
                  alt="Fachada do escritório TRK"
                  className="trk-story__image"
                  loading="lazy"
                />
              </div>
              <div className="trk-story__body">
                <h3>Aqui é a casa da TRK</h3>
                <p>
                  Uma estrutura pensada para apoiar milhares de usuários
                  todos os dias. Da recepção ao servidor, tudo foi feito
                  para que você possa concluir suas tarefas, sacar seus
                  ganhos e confiar na plataforma.
                </p>
              </div>
            </article>

            <p className="trk-story__footnote">
              TRK — feita por pessoas, para pessoas que querem prosperar.
            </p>
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

      {envelopeOpen ? (
        <div className="envelope-modal-overlay" onClick={closeEnvelopeModal}>
          <div className="envelope-confetti" aria-hidden="true">
            {Array.from({ length: 28 }).map((_, i) => (
              <span
                key={i}
                className={`confetti confetti--${(i % 6) + 1}`}
                style={{
                  left: `${(i * 3.7) % 100}%`,
                  animationDelay: `${(i % 10) * 0.22}s`,
                  animationDuration: `${3 + (i % 5) * 0.4}s`,
                }}
              />
            ))}
          </div>

          <div className="envelope-modal envelope-modal--festive" onClick={(e) => e.stopPropagation()}>
            <span className="envelope-deco envelope-deco--coin envelope-deco--coin-1" aria-hidden="true">
              <svg viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="14" fill="url(#coinGrad1)" stroke="#c87a00" strokeWidth="1.5" />
                <circle cx="16" cy="16" r="10" fill="none" stroke="#c87a00" strokeWidth="1" opacity="0.5" />
                <text x="16" y="21" textAnchor="middle" fontSize="14" fontWeight="900" fill="#8b4513">$</text>
                <defs>
                  <radialGradient id="coinGrad1" cx="0.3" cy="0.3">
                    <stop offset="0%" stopColor="#fff3a0" />
                    <stop offset="60%" stopColor="#ffc933" />
                    <stop offset="100%" stopColor="#c87a00" />
                  </radialGradient>
                </defs>
              </svg>
            </span>
            <span className="envelope-deco envelope-deco--coin envelope-deco--coin-2" aria-hidden="true">
              <svg viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="14" fill="url(#coinGrad2)" stroke="#c87a00" strokeWidth="1.5" />
                <circle cx="16" cy="16" r="10" fill="none" stroke="#c87a00" strokeWidth="1" opacity="0.5" />
                <text x="16" y="21" textAnchor="middle" fontSize="11" fontWeight="900" fill="#8b4513">R$</text>
                <defs>
                  <radialGradient id="coinGrad2" cx="0.3" cy="0.3">
                    <stop offset="0%" stopColor="#fff3a0" />
                    <stop offset="60%" stopColor="#ffc933" />
                    <stop offset="100%" stopColor="#c87a00" />
                  </radialGradient>
                </defs>
              </svg>
            </span>
            <span className="envelope-deco envelope-deco--coin envelope-deco--coin-3" aria-hidden="true">
              <svg viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="14" fill="url(#coinGrad3)" stroke="#c87a00" strokeWidth="1.5" />
                <text x="16" y="21" textAnchor="middle" fontSize="14" fontWeight="900" fill="#8b4513">$</text>
                <defs>
                  <radialGradient id="coinGrad3" cx="0.3" cy="0.3">
                    <stop offset="0%" stopColor="#fff3a0" />
                    <stop offset="60%" stopColor="#ffc933" />
                    <stop offset="100%" stopColor="#c87a00" />
                  </radialGradient>
                </defs>
              </svg>
            </span>
            <span className="envelope-deco envelope-deco--coin envelope-deco--coin-4" aria-hidden="true">
              <svg viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="14" fill="url(#coinGrad4)" stroke="#c87a00" strokeWidth="1.5" />
                <circle cx="16" cy="16" r="10" fill="none" stroke="#c87a00" strokeWidth="1" opacity="0.5" />
                <text x="16" y="21" textAnchor="middle" fontSize="14" fontWeight="900" fill="#8b4513">$</text>
                <defs>
                  <radialGradient id="coinGrad4" cx="0.3" cy="0.3">
                    <stop offset="0%" stopColor="#fff3a0" />
                    <stop offset="60%" stopColor="#ffc933" />
                    <stop offset="100%" stopColor="#c87a00" />
                  </radialGradient>
                </defs>
              </svg>
            </span>
            <span className="envelope-deco envelope-deco--star envelope-deco--star-1" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <polygon points="12,2 14.6,9 22,9.5 16.5,14 18.4,21 12,17 5.6,21 7.5,14 2,9.5 9.4,9" fill="#fff5b0" stroke="#ffb302" strokeWidth="1" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="envelope-deco envelope-deco--star envelope-deco--star-2" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <polygon points="12,2 14.6,9 22,9.5 16.5,14 18.4,21 12,17 5.6,21 7.5,14 2,9.5 9.4,9" fill="#fff5b0" stroke="#ffb302" strokeWidth="1" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="envelope-deco envelope-deco--star envelope-deco--star-3" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <polygon points="12,2 14.6,9 22,9.5 16.5,14 18.4,21 12,17 5.6,21 7.5,14 2,9.5 9.4,9" fill="#fff5b0" stroke="#ffb302" strokeWidth="1" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="envelope-deco envelope-deco--gem envelope-deco--gem-1" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <polygon points="12,2 20,9 12,22 4,9" fill="url(#gemGrad1)" stroke="#1976d2" strokeWidth="1" strokeLinejoin="round" />
                <polygon points="12,2 20,9 12,9 4,9" fill="rgba(255,255,255,0.35)" />
                <line x1="12" y1="2" x2="12" y2="9" stroke="#1976d2" strokeWidth="0.6" opacity="0.6" />
                <defs>
                  <linearGradient id="gemGrad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7ed4ff" />
                    <stop offset="100%" stopColor="#1976d2" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
            <span className="envelope-deco envelope-deco--gem envelope-deco--gem-2" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <rect x="3" y="9" width="18" height="12" rx="1.5" fill="url(#giftBox)" stroke="#a51717" strokeWidth="0.8" />
                <rect x="3" y="9" width="18" height="3" fill="rgba(0,0,0,0.18)" />
                <rect x="10.5" y="9" width="3" height="12" fill="#ffd54f" />
                <path d="M9 9c-1.5-2-1-4 1-4s2 2 2 4" fill="none" stroke="#ffd54f" strokeWidth="1.2" />
                <path d="M15 9c1.5-2 1-4-1-4s-2 2-2 4" fill="none" stroke="#ffd54f" strokeWidth="1.2" />
                <defs>
                  <linearGradient id="giftBox" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff5050" />
                    <stop offset="100%" stopColor="#a51717" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
            <span className="envelope-deco envelope-deco--fire" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3-1-3 0-7 1-10z" fill="url(#fireGrad)" stroke="#c41e1e" strokeWidth="0.8" />
                <path d="M12 10c0.5 2 2 3 2 5a2 2 0 0 1-4 0c0-1 1-2 2-2 0-1 0-2 0-3z" fill="#fff3a0" />
                <defs>
                  <linearGradient id="fireGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffd54f" />
                    <stop offset="60%" stopColor="#ff8a03" />
                    <stop offset="100%" stopColor="#c41e1e" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
            <span className="envelope-deco envelope-deco--party" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M3 21l4-12 8 8z" fill="url(#partyGrad)" stroke="#c41e1e" strokeWidth="0.8" strokeLinejoin="round" />
                <circle cx="9" cy="13" r="0.8" fill="#fff" />
                <circle cx="11" cy="16" r="0.8" fill="#ffd54f" />
                <circle cx="7" cy="17" r="0.8" fill="#7ed4ff" />
                <circle cx="13" cy="14" r="0.8" fill="#7dd6a7" />
                <defs>
                  <linearGradient id="partyGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ff5050" />
                    <stop offset="100%" stopColor="#ff8a03" />
                  </linearGradient>
                </defs>
              </svg>
            </span>

            <button
              type="button"
              className="envelope-modal-close"
              onClick={closeEnvelopeModal}
              aria-label="Fechar"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="envelope-illust" aria-hidden="true">
              <span className="envelope-illust__glow" />
              <span className="envelope-illust__rays" />
              <span className="envelope-illust__body">
                <span className="envelope-illust__flap" />
                <span className="envelope-illust__seal">
                  <svg viewBox="0 0 24 24">
                    <polygon points="12,3 14.6,9.5 21.5,10 16,14.5 18,21 12,17.5 6,21 8,14.5 2.5,10 9.4,9.5" fill="#fff5b0" stroke="#a51717" strokeWidth="1" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="envelope-illust__shine" />
              </span>
              <span className="envelope-illust__sparkle envelope-illust__sparkle--1">
                <svg viewBox="0 0 12 12"><path d="M6 0v12M0 6h12M2 2l8 8M10 2l-8 8" stroke="#fff7c2" strokeWidth="1.2" strokeLinecap="round" /></svg>
              </span>
              <span className="envelope-illust__sparkle envelope-illust__sparkle--2">
                <svg viewBox="0 0 12 12"><path d="M6 0v12M0 6h12M2 2l8 8M10 2l-8 8" stroke="#fff7c2" strokeWidth="1.2" strokeLinecap="round" /></svg>
              </span>
              <span className="envelope-illust__sparkle envelope-illust__sparkle--3">
                <svg viewBox="0 0 12 12"><path d="M6 0v12M0 6h12M2 2l8 8M10 2l-8 8" stroke="#fff7c2" strokeWidth="1.2" strokeLinecap="round" /></svg>
              </span>
            </div>

            <h3 className="envelope-modal-title">
              <span className="envelope-modal-title__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <rect x="4" y="6" width="16" height="14" rx="1.5" fill="url(#titleEnv)" stroke="#a51717" strokeWidth="1" />
                  <rect x="4" y="6" width="16" height="4" fill="rgba(0,0,0,0.18)" />
                  <circle cx="12" cy="13" r="2.5" fill="#ffd54f" stroke="#c87a00" strokeWidth="0.6" />
                  <defs>
                    <linearGradient id="titleEnv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ff5050" />
                      <stop offset="100%" stopColor="#a51717" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
              Envelope da Sorte
              <span className="envelope-modal-title__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <rect x="4" y="6" width="16" height="14" rx="1.5" fill="url(#titleEnv2)" stroke="#a51717" strokeWidth="1" />
                  <rect x="4" y="6" width="16" height="4" fill="rgba(0,0,0,0.18)" />
                  <circle cx="12" cy="13" r="2.5" fill="#ffd54f" stroke="#c87a00" strokeWidth="0.6" />
                  <defs>
                    <linearGradient id="titleEnv2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ff5050" />
                      <stop offset="100%" stopColor="#a51717" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h3>
            <p className="envelope-modal-text">
              Insira seu código mágico e descubra qual prêmio você ganhou!
            </p>

            <input
              type="text"
              className="envelope-modal-input"
              placeholder="DIGITE O CÓDIGO"
              value={envelopeCode}
              onChange={(e) => setEnvelopeCode(e.target.value.toUpperCase())}
              maxLength={32}
              autoFocus
            />

            {envelopeFeedback ? (
              <div className={`envelope-modal-feedback envelope-modal-feedback--${envelopeFeedback.type}`}>
                {envelopeFeedback.message}
              </div>
            ) : null}

            <button
              type="button"
              className="envelope-modal-btn"
              onClick={handleRedeemEnvelope}
              disabled={envelopeLoading}
            >
              <span className="envelope-modal-btn__shine" />
              <svg className="envelope-modal-btn__icon" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="9" width="18" height="12" rx="1.5" fill="#fff" stroke="#fff" strokeWidth="0.8" opacity="0.95" />
                <rect x="3" y="9" width="18" height="3" fill="rgba(0,0,0,0.18)" />
                <rect x="10.5" y="9" width="3" height="12" fill="#ffd54f" />
                <path d="M9 9c-1.5-2-1-4 1-4s2 2 2 4" fill="none" stroke="#ffd54f" strokeWidth="1.4" />
                <path d="M15 9c1.5-2 1-4-1-4s-2 2-2 4" fill="none" stroke="#ffd54f" strokeWidth="1.4" />
              </svg>
              {envelopeLoading ? 'Abrindo envelope...' : 'ABRIR ENVELOPE'}
            </button>

            <p className="envelope-modal-luck">
              <svg className="envelope-modal-luck__icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 4c-1 2 0 4 0 4s-2-1-4-1-3 2-2 4c1 2 3 2 3 2s-2 1-2 3 2 3 4 2c2-1 3-3 3-3s1 2 3 3 4 0 4-2-2-3-2-3 2 0 3-2c1-2 0-4-2-4s-4 1-4 1 1-2 0-4-3-2-3-2z" fill="#7dd6a7" stroke="#2f8a5b" strokeWidth="0.8" strokeLinejoin="round" />
                <path d="M12 12v8" stroke="#2f8a5b" strokeWidth="1" strokeLinecap="round" />
              </svg>
              Boa sorte!
              <svg className="envelope-modal-luck__icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 4c-1 2 0 4 0 4s-2-1-4-1-3 2-2 4c1 2 3 2 3 2s-2 1-2 3 2 3 4 2c2-1 3-3 3-3s1 2 3 3 4 0 4-2-2-3-2-3 2 0 3-2c1-2 0-4-2-4s-4 1-4 1 1-2 0-4-3-2-3-2z" fill="#7dd6a7" stroke="#2f8a5b" strokeWidth="0.8" strokeLinejoin="round" />
                <path d="M12 12v8" stroke="#2f8a5b" strokeWidth="1" strokeLinecap="round" />
              </svg>
            </p>
          </div>
        </div>
      ) : null}
    </main>
  )
}
