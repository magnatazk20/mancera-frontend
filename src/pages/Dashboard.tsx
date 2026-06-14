import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBalanceSocket } from '../hooks/useBalanceSocket'
import AppSidebar from '../components/AppSidebar'
import { API_URL } from '../utils/apiUrl'

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
  profitPercent: number
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


const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [balance, setBalance] = useState(0)
  const [currentVip, setCurrentVip] = useState<{ vipLevelId: number; name: string } | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<CycleProduct | null>(null)
  const [isBuying, setIsBuying] = useState(false)
  const [showWelcomeModal, setShowWelcomeModal] = useState(true)
  const [commissionLevels, setCommissionLevels] = useState<CommissionLevel[]>([])
  const [modalSlide, setModalSlide] = useState(0)
  const modalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [showEnvelopeModal, setShowEnvelopeModal] = useState(false)
  const [redeemCode, setRedeemCode] = useState('')
  const [redeemLoading, setRedeemLoading] = useState(false)
  const [redeemFeedback, setRedeemFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [redeemSuccess, setRedeemSuccess] = useState(false)
  const [depositNotices, setDepositNotices] = useState<string[]>([])
  const [cycleProducts, setCycleProducts] = useState<CycleProduct[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  const randomDigits = (length: number) =>
    Array.from({ length }, () => Math.floor(Math.random() * 10)).join('')

  const generateMaskedMember = () => `${randomDigits(3)}****${randomDigits(4)}`

  const generateDepositValue = () => {
    const possibleValues = [100, 120, 150, 180, 200, 250, 300, 350, 500, 800, 1000, 1500]
    return possibleValues[Math.floor(Math.random() * possibleValues.length)]
  }

  const generateNoticeList = (count = 24) =>
    Array.from({ length: count }, () =>
      `Parabéns ao membro ${generateMaskedMember()} por depositar ${formatBRL(generateDepositValue())}; `
    )

  const handleRedeemCode = async () => {
    if (!user?.id) {
      setRedeemFeedback({ type: 'error', message: 'Usuário não autenticado.' })
      return
    }
    const normalized = redeemCode.trim().toUpperCase()
    if (!normalized) {
      setRedeemFeedback({ type: 'error', message: 'Digite um código.' })
      return
    }
    setRedeemLoading(true)
    const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''
    try {
      const res = await fetch(`${API_URL}/api/gift-codes/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId: user.id, code: normalized }),
      })
      const data = await res.json().catch(() => ({})) as {
        ok?: boolean; error?: string; message?: string; rewardValue?: number
      }
      if (!res.ok || !data?.ok) {
        setRedeemFeedback({ type: 'error', message: data?.error ?? 'Não foi possível resgatar.' })
        return
      }
      const reward = Number(data?.rewardValue ?? 0)
      setRedeemFeedback({
        type: 'success',
        message: reward > 0
          ? `Código resgatado! Você recebeu ${Number(reward).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.` : 'Código resgatado com sucesso!',
      })
      setRedeemSuccess(true)
      setShowEnvelopeModal(false)
      setRedeemCode('')
    } catch {
      setRedeemFeedback({ type: 'error', message: 'Erro de conexão.' })
    } finally {
      setRedeemLoading(false)
    }
  }

  useBalanceSocket(user?.id ?? null, (newBalance) => {
    setBalance(Number(newBalance ?? 0))
  })

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
        console.log('[Dashboard] /api/user/summary status:', response.status)
        if (!response.ok) return
        const data = (await response.json()) as { balance?: number; currentVip?: { vipLevelId: number; name: string } | null }
        setBalance(Number(data.balance ?? 0))
        setCurrentVip(data.currentVip ?? null)
      } catch {/* silencioso */}
    }

    const loadCommissionLevels = async () => {
      try {
        const response = await fetch(`${API_URL}/api/referral/commission-levels`)
        if (!response.ok) return
        const data = (await response.json()) as { ok?: boolean; levels?: CommissionLevel[] }
        if (!data?.ok || !Array.isArray(data.levels)) return
        setCommissionLevels(data.levels)
      } catch {/* silencioso */}
    }

    loadSummary()
    loadCommissionLevels()
  }, [user?.id])

  useEffect(() => {
    if (!showWelcomeModal) {
      if (modalTimerRef.current) clearInterval(modalTimerRef.current)
      return
    }
    const totalSlides = 1
    if (totalSlides <= 1) return
    modalTimerRef.current = setInterval(() => {
      setModalSlide((prev) => (prev + 1) % totalSlides)
    }, 4000)
    return () => {
      if (modalTimerRef.current) clearInterval(modalTimerRef.current)
    }
  }, [showWelcomeModal, commissionLevels.length])

  useEffect(() => {
    setDepositNotices(generateNoticeList(24))
    const timer = setInterval(() => {
      setDepositNotices(generateNoticeList(24))
    }, 20000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const loadCycleProducts = async () => {
      setLoadingProducts(true)
      try {
        const token = localStorage.getItem('token') ?? sessionStorage.getItem('token')
        const res = await fetch(`${API_URL}/api/dashboard/cycle-products`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const data = await res.json().catch(() => ({})) as { ok?: boolean; products?: Array<Record<string, unknown>> }
        if (res.ok && data?.ok && Array.isArray(data.products)) {
          const mapped: CycleProduct[] = data.products.map((item) => ({
            id: Number(item.id ?? 0),
            name: String(item.name ?? ''),
            description: String(item.description ?? ''),
            amount: Number(item.amount ?? 0),
            profit: Number(item.profit ?? 0),
            profitPercent: Number(item.profitPercent ?? 0),
            cycleDays: Number(item.cycleDays ?? 0),
            imageUrl: String(item.imageUrl ?? ''),
            isActive: Boolean(item.isActive),
            sortOrder: Number(item.sortOrder ?? 0),
            stockQuantity: Number(item.stockQuantity ?? 0),
          }))
          setCycleProducts(mapped.filter(p => p.isActive))
        }
      } catch {
        // silencioso
      } finally {
        setLoadingProducts(false)
      }
    }
    loadCycleProducts()
  }, [])

  const closePurchaseModal = () => {
    if (isBuying) return
    setSelectedPlan(null)
  }

  const formatDateTime = (date: Date) =>
    date.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  const confirmBuyCycle = async () => {
    if (!user?.id || !selectedPlan || isBuying) return
    setIsBuying(true)
    try {
      const response = await fetch(`${API_URL}/api/cycle-products/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, cycleProductId: selectedPlan.id }),
      })
      const data = (await response.json()) as {
        ok?: boolean; error?: string; message?: string; balanceAfter?: number
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

  if (!user) return null

  return (
    <main className="dash-app">
      <section className="dash-main">
        <AppSidebar />

        <div className="dash-content">
          {/* ── Banner de boas-vindas ── */}
          <section className="trk-hero-banner" aria-label="Banner de boas-vindas">
            <iframe
              src="https://player.vimeo.com/video/723441502?autoplay=1&loop=1&muted=1&background=1&quality=auto"
              allow="autoplay; fullscreen"
              title="Mancera"
            />
            <div className="trk-hero-vip-wrap">
              {currentVip ? (
                <div className="trk-hero-vip">VIP Ativo: {currentVip.name}</div>
              ) : null}
            </div>
          </section>

          {/* ── Notice bar ── */}
          <div className="dash-notice-bar-vant" style={{ marginTop: '0' }}>
            <div className="dash-notice-icon-wrap">
              <svg className="dash-notice-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            </div>
            <div className="dash-notice-marquee">
              <div className="dash-notice-track">
                {depositNotices.map((notice, index) => (
                  <span key={`notice-a-${index}`}>{notice}</span>
                ))}
                {depositNotices.map((notice, index) => (
                  <span key={`notice-b-${index}`}>{notice}</span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Quick Actions Grid ── */}
          <section className="dash-quick-grid">
            <button type="button" className="dash-quick-item" onClick={() => navigate('/checkin')}>
              <div className="dash-quick-icon">
                <svg viewBox="0 0 20 20" fill="none" width="22" height="22">
                  <path d="M15.5 1C15.2239 1 15 0.776142 15 0.5C15 0.223858 14.7761 0 14.5 0H13.5C13.2239 0 13 0.223858 13 0.5C13 0.776142 12.7761 1 12.5 1H7.5C7.22386 1 7 0.776142 7 0.5C7 0.223858 6.77614 0 6.5 0H5.5C5.22386 0 5 0.223858 5 0.5C5 0.776142 4.77614 1 4.5 1H1C0.447715 1 0 1.44772 0 2V19C0 19.5523 0.447715 20 1 20H19C19.5523 20 20 19.5523 20 19V2C20 1.44771 19.5523 1 19 1H15.5ZM10 15.83L9.29461 16.5354C8.90506 16.9249 8.27383 16.9261 7.8829 16.5379L7.17 15.83L5.045 13.705C4.65564 13.3156 4.65564 12.6844 5.045 12.295C5.43436 11.9056 6.06564 11.9056 6.455 12.295L7.87289 13.7129C8.26342 14.1034 8.89658 14.1034 9.28711 13.7129L13.5347 9.46531C13.9242 9.07578 14.5558 9.07578 14.9453 9.46531C15.3346 9.8546 15.3349 10.4857 14.9459 10.8753L10 15.83ZM3 6C2.44772 6 2 5.55228 2 5V4C2 3.44772 2.44772 3 3 3H4.5C4.77614 3 5 3.22386 5 3.5C5 3.77614 5.22386 4 5.5 4H6.5C6.77614 4 7 3.77614 7 3.5C7 3.22386 7.22386 3 7.5 3H12.5C12.7761 3 13 3.22386 13 3.5C13 3.77614 13.2239 4 13.5 4H14.5C14.7761 4 15 3.77614 15 3.5C15 3.22386 15.2239 3 15.5 3H17C17.5523 3 18 3.44772 18 4V5C18 5.55229 17.5523 6 17 6H3Z" fill="currentColor"/>
                </svg>
              </div>
              <p className="dash-quick-label">Entrar</p>
            </button>

            <button type="button" className="dash-quick-item" onClick={() => navigate('/position')}>
              <div className="dash-quick-icon">
                <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
                  <path d="M12 11C12.6566 11 13.3068 11.1293 13.9134 11.3806C14.52 11.6319 15.0712 12.0002 15.5355 12.4645C15.9998 12.9288 16.3681 13.48 16.6194 14.0866C16.8707 14.6932 17 15.3434 17 16V22H7V16C7 15.3434 7.12933 14.6932 7.3806 14.0866C7.63188 13.48 8.00017 12.9288 8.46447 12.4645C8.92876 12.0002 9.47996 11.6319 10.0866 11.3806C10.6932 11.1293 11.3434 11 12 11ZM5.288 14.006C5.12887 14.5428 5.03486 15.0968 5.008 15.656L5 16V22H2V17.5C1.9998 16.6376 2.31803 15.8054 2.89363 15.1632C3.46924 14.521 4.2617 14.1139 5.119 14.02L5.289 14.006H5.288ZM18.712 14.006C19.6019 14.0602 20.4376 14.452 21.0486 15.1012C21.6596 15.7505 21.9999 16.6084 22 17.5V22H19V16C19 15.307 18.9 14.638 18.712 14.006ZM5.5 8C5.82831 8 6.1534 8.06466 6.45671 8.1903C6.76002 8.31594 7.03562 8.50009 7.26777 8.73223C7.49991 8.96438 7.68406 9.23998 7.8097 9.54329C7.93534 9.84661 8 10.1717 8 10.5C8 10.8283 7.93534 11.1534 7.8097 11.4567C7.68406 11.76 7.49991 12.0356 7.26777 12.2678C7.03562 12.4999 6.76002 12.6841 6.45671 12.8097C6.1534 12.9353 5.82831 13 5.5 13C4.83696 13 4.20107 12.7366 3.73223 12.2678C3.26339 11.7989 3 11.163 3 10.5C3 9.83696 3.26339 9.20107 3.73223 8.73223C4.20107 8.26339 4.83696 8 5.5 8ZM18.5 8C18.8283 8 19.1534 8.06466 19.4567 8.1903C19.76 8.31594 20.0356 8.50009 20.2678 8.73223C20.4999 8.96438 20.6841 9.23998 20.8097 9.54329C20.9353 9.84661 21 10.1717 21 10.5C21 10.8283 20.9353 11.1534 20.8097 11.4567C20.6841 11.76 20.4999 12.0356 20.2678 12.2678C20.0356 12.4999 19.76 12.6841 19.4567 12.8097C19.1534 12.9353 18.8283 13 18.5 13C17.837 13 17.2011 12.7366 16.7322 12.2678C16.2634 11.7989 16 11.163 16 10.5C16 9.83696 16.2634 9.20107 16.7322 8.73223C17.2011 8.26339 17.837 8 18.5 8ZM12 2C13.0609 2 14.0783 2.42143 14.8284 3.17157C15.5786 3.92172 16 4.93913 16 6C16 7.06087 15.5786 8.07828 14.8284 8.82843C14.0783 9.57857 13.0609 10 12 10C10.9391 10 9.92172 9.57857 9.17157 8.82843C8.42143 8.07828 8 7.06087 8 6C8 4.93913 8.42143 3.92172 9.17157 3.17157C9.92172 2.42143 10.9391 2 12 2Z" fill="currentColor"/>
                </svg>
              </div>
              <p className="dash-quick-label">Minha equipe</p>
            </button>

            <button type="button" className="dash-quick-item" onClick={() => navigate('/invite')}>
              <div className="dash-quick-icon">
                <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
                  <path d="M22.261 12.0648C22.4563 12.3725 22.56 12.7295 22.56 13.0939V19.68C22.56 20.4438 22.2566 21.1764 21.7165 21.7165C21.1764 22.2566 20.4438 22.56 19.68 22.56H4.32C3.55618 22.56 2.82364 22.2566 2.28354 21.7165C1.74343 21.1764 1.44 20.4438 1.44 19.68V13.1011C1.44001 12.757 1.53253 12.4191 1.70787 12.123C1.88322 11.8268 2.13495 11.5832 2.43672 11.4177C2.73848 11.2522 3.07919 11.1709 3.42317 11.1822C3.76716 11.1935 4.10177 11.2971 4.392 11.4821L11.9798 16.32L19.6104 11.4735C19.8233 11.3382 20.0607 11.2462 20.3091 11.2027C20.5575 11.1593 20.812 11.1652 21.0582 11.2201C21.3043 11.275 21.5372 11.3779 21.7436 11.5228C21.95 11.6677 22.1258 11.8519 22.261 12.0648ZM16.8 2.40002C17.5638 2.40002 18.2964 2.70345 18.8365 3.24356C19.3766 3.78366 19.68 4.5162 19.68 5.28002V10.08L12.0158 14.88L4.32 10.08V5.28002C4.32 4.5162 4.62343 3.78366 5.16354 3.24356C5.70364 2.70345 6.43618 2.40002 7.2 2.40002H16.8Z" fill="currentColor"/>
                  <path d="M12.5967 10.7942C12.438 10.9516 12.2235 11.0399 12 11.0399C11.7765 11.0399 11.5621 10.9516 11.4034 10.7942L9.21649 8.61978C8.83045 8.22042 8.63448 7.72674 8.64023 7.21477C8.64598 6.70279 8.85298 6.21364 9.21649 5.85306C9.58669 5.48599 10.0869 5.28003 10.6083 5.28003C11.1296 5.28003 11.6298 5.48599 12 5.85306C12.3702 5.48599 12.8704 5.28003 13.3918 5.28003C13.9131 5.28003 14.4133 5.48599 14.7835 5.85306C15.1462 6.21287 15.3531 6.70068 15.3596 7.2115C15.3662 7.72231 15.1719 8.21528 14.8186 8.58426L14.7835 8.62026L12.5967 10.7942Z" fill="white"/>
                </svg>
              </div>
              <p className="dash-quick-label">Convidar Amigos</p>
            </button>

            <button type="button" className="dash-quick-item" onClick={() => {}}>
              <div className="dash-quick-icon">
                <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
                  <path d="M18.6656 0H5.33436C3.86249 0 2.66718 1.19297 2.66718 2.66719V21.3328C2.66718 22.8047 3.86014 24 5.33436 24H18.668C20.1398 24 21.3351 22.807 21.3351 21.3328V2.66719C21.3328 1.19297 20.1398 0 18.6656 0ZM12.9422 21.7266C12.6914 21.9773 12.3539 22.118 12 22.118C11.2641 22.118 10.6664 21.5203 10.6664 20.7844C10.6664 20.0484 11.2641 19.4508 12 19.4508C12.7359 19.4508 13.3336 20.0484 13.3336 20.7844C13.3336 21.1359 13.193 21.4758 12.9422 21.7266ZM18.6141 15.9914C18.6141 16.3453 18.4734 16.6828 18.2273 16.9336C17.9789 17.1844 17.6437 17.3227 17.2922 17.3227H6.7078C6.35624 17.3227 6.02108 17.182 5.77264 16.9336C5.52421 16.6828 5.38593 16.3453 5.38593 15.9914V4.00781C5.38593 3.27187 5.97889 2.67656 6.7078 2.67656H17.2922C17.6437 2.67656 17.9789 2.81719 18.2273 3.06563C18.4758 3.31641 18.6141 3.65391 18.6141 4.00781V15.9914Z" fill="currentColor"/>
                  <path d="M14.1516 9.90002L12.8273 11.2242V6.38674C12.8273 5.92502 12.4547 5.55237 11.993 5.55237C11.5313 5.55237 11.1586 5.92502 11.1586 6.38674V11.2242L9.83673 9.90002C9.51094 9.57424 8.9836 9.57424 8.65782 9.90002C8.33204 10.2258 8.33204 10.7531 8.65782 11.0789L11.4023 13.8258C11.5594 13.9828 11.7703 14.0696 11.9906 14.0696C12.2109 14.0696 12.4242 13.9805 12.5789 13.8258L15.3258 11.0789C15.6516 10.7531 15.6516 10.2258 15.3258 9.90002C15 9.57424 14.4773 9.57659 14.1516 9.90002Z" fill="currentColor"/>
                </svg>
              </div>
              <p className="dash-quick-label">Baixar APP</p>
            </button>



            <button type="button" className="dash-quick-item" onClick={() => navigate('/task-bonus')}>
              <div className="dash-quick-icon">
                <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
                  <path d="M20 12v10H4V12M22 7H2v5h20V7z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 22V7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                  <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="dash-quick-label">Bônus de Tarefa</p>
            </button>

            <button type="button" className="dash-quick-item" onClick={() => navigate('/roleta/')}>
              <div className="dash-quick-icon">
                <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
                  <circle cx="12" cy="12" r="2" fill="currentColor" />
                  <path d="M12 3V10M21 12H14M12 21V14M3 12H10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </div>
              <p className="dash-quick-label">Roleta</p>
            </button>
          </section>

          {/* ── Imagem no lugar do menu de navegação ── */}
          <section className="dash-menu-grid">
            <img
              src="https://sensabeauty.com/cdn/shop/articles/Luxurious_Mancera_perfume_elegance.png?v=1774022491&width=1400"
              alt="Mancera perfume"
              className="dash-menu-replacement-image"
            />
          </section>

          <section className="chromo-shortcuts" aria-label="Atalhos rápidos">
            <button type="button" className="chromo-item" onClick={() => navigate('/cashin')}>
              <span className="chromo-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M3.5 6.5h17v11h-17z" fill="none" stroke="currentColor" strokeWidth="1.7"/><path d="M7 10.5h10M7 14h7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
              </span>
              <span className="chromo-label">Recarga</span>
            </button>
            <button type="button" className="chromo-item" onClick={() => navigate('/saque')}>
              <span className="chromo-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.7"/><path d="M12 7v10M8.7 9.5h6.1M8.7 14.5h6.1" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
              </span>
              <span className="chromo-label">Retirada</span>
            </button>
            <button type="button" className="chromo-item" onClick={() => navigate('/support')}>
              <span className="chromo-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 16 0v5a2 2 0 0 1-2 2h-2v-5h3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M8 19H6a2 2 0 0 1-2-2v-5h4v7zM10 19h4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
              </span>
              <span className="chromo-label">Ajuda</span>
            </button>
            <button type="button" className="chromo-item" onClick={() => {}}>
              <span className="chromo-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M12 4v11M8 11l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 19h14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
              </span>
              <span className="chromo-label">Download</span>
            </button>
            <button type="button" className="chromo-item" onClick={() => navigate('/checkin')}>
              <span className="chromo-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7"/><path d="M8 3v4M16 3v4M4 9h16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M9 13h2M13 13h2M9 16h2M13 16h2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
              </span>
              <span className="chromo-label">Check-in</span>
            </button>
          </section>

          <section className="perfume-income-banner" aria-label="Banner de investimento em perfumes">
            <div className="perfume-income-banner__overlay" />
            <div className="perfume-income-banner__content">
              <p>
                Invista em uma linha de perfumes.
                <br />
                <span>Obtenha uma renda estável</span>
                <br />
                <span>a longo prazo.</span>
              </p>
            </div>
          </section>

          {/* ── Sobre a TRK ── */}
          <section className="trk-about-section">
          </section>

          {/* ── Produtos de Ciclo ── */}
          {!loadingProducts && cycleProducts.length > 0 && (
            <section className="dash-cycle-products">
              <h2 className="dash-cycle-products-title">Produtos  Liberados</h2>
              <div className="dash-cycle-products-grid">
                {cycleProducts.slice(0, 6).map((product) => (
                  <div
                    key={product.id}
                    className="dash-cycle-product-card"
                    onClick={() => navigate('/cycle-products')}
                  >
                    <div className="dash-cycle-product-image">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} />
                      ) : (
                        <div className="dash-cycle-product-placeholder">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="dash-cycle-product-info">
                      <h3 className="dash-cycle-product-name">{product.name}</h3>
                      <div className="dash-cycle-product-stats">
                        <div className="dash-cycle-stat-item">
                          <span className="dash-cycle-stat-label">Valor do produto</span>
                          <span className="dash-cycle-stat-value">{formatBRL(product.amount)}</span>
                        </div>
                        <div className="dash-cycle-stat-item">
                          <span className="dash-cycle-stat-label">Renda diária</span>
                          <span className="dash-cycle-stat-value" style={{ color: '#16a34a' }}>
                            {formatBRL(Number((product.amount * ((product.profitPercent > 0 ? product.profitPercent : product.profit) / 100)).toFixed(2)))}
                          </span>
                        </div>
                        <div className="dash-cycle-stat-item">
                          <span className="dash-cycle-stat-label">Total de dias</span>
                          <span className="dash-cycle-stat-value">{product.cycleDays} dias</span>
                        </div>
                      </div>
                    </div>
                    <div className="dash-cycle-product-buy">
                      <span>Comprar</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="dash-cycle-products-more"
                onClick={() => navigate('/cycle-products')}
              >
                Ver todos os produtos
              </button>
            </section>
          )}
        </div>
      </section>

      {/* ── Modal de confirmação de compra ── */}
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

      {/* ── Envelope vermelho modal ── */}
      {showEnvelopeModal ? (
        <div className="envelope-modal-backdrop" onClick={() => setShowEnvelopeModal(false)}>
          <div className="envelope-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="envelope-confetti">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className="envelope-confetti-piece" style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 1.5}s`,
                  background: ['#ff8a03', '#f7d981', '#ff4d4d', '#4ade80', '#fbbf24'][i % 5],
                }} />
              ))}
            </div>
            <div className="envelope-sparkles">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="envelope-sparkle" style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                }}>✨</div>
              ))}
            </div>
            <div className="envelope-icon-wrap">
              <svg viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="8" y="24" width="56" height="40" rx="4" fill="#ff8a03" stroke="#f7d981" strokeWidth="2"/>
                <path d="M8 28c0-8 12-16 28-16s28 8 28 16" stroke="#f7d981" strokeWidth="2" fill="none"/>
                <path d="M36 12V28M36 28L28 20M36 28L44 20" stroke="#ff8a03" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M28 52h16M36 44v8" stroke="#f7d981" strokeWidth="2.5" strokeLinecap="round"/>
                <rect x="28" y="40" width="16" height="16" rx="2" fill="#f7d981" fillOpacity="0.3" stroke="#f7d981" strokeWidth="1.5"/>
                <circle cx="36" cy="48" r="3" fill="#fff8ef"/>
              </svg>
            </div>
            <h2 className="envelope-title">Código Presente</h2>
            <p className="envelope-subtitle">Insira um código de presente e ganhe recompensas exclusivas!</p>
            <div className="envelope-code-input-wrap">
              <input
                type="text"
                className="envelope-code-input"
                placeholder="Digite seu código aqui"
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                autoComplete="off"
                maxLength={32}
              />
            </div>
            <button
              type="button"
              className="envelope-btn"
              onClick={handleRedeemCode}
              disabled={redeemLoading}
            >
              {redeemLoading ? 'Resgatando...' : 'Resgatar Código 🎁'}
            </button>
            {redeemFeedback && (
              <div className={`envelope-feedback ${redeemFeedback.type}`}>
                {redeemFeedback.type === 'success' ? '✅ ' : '❌ '}
                {redeemFeedback.message}
              </div>
            )}
            <button
              type="button"
              className="envelope-btn-close"
              onClick={() => { setShowEnvelopeModal(false); setRedeemCode(''); setRedeemFeedback(null); setRedeemSuccess(false); }}
            >
              Fechar
            </button>
          </div>
        </div>
      ) : null}

      {/* ── Success overlay after redeem ── */}
      {redeemSuccess ? (
        <div className="redeem-success-overlay" onClick={() => setRedeemSuccess(false)}>
          <div className="redeem-success-card" onClick={(e) => e.stopPropagation()}>
            <div className="redeem-success-confetti">
              {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} className="redeem-success-confetti-piece" style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  background: ['#ff8a03', '#f7d981', '#ff4d4d', '#4ade80', '#fbbf24'][i % 5],
                }} />
              ))}
            </div>
            <div className="redeem-success-icon">
              <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="40" cy="40" r="36" fill="#fff8ef" stroke="#ff8a03" strokeWidth="3"/>
                <path d="M40 22c-9.94 0-18 8.06-18 18s8.06 18 18 18 18-8.06 18-18-8.06-18-18-18zm0 30c-6.63 0-12-5.37-12-12s5.37-12 12-12 12 5.37 12 12-5.37 12-12 12z" fill="#ff8a03"/>
                <path d="M40 30c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10-4.48-10-10-10zm6 11.5l-4 4 2.8 2.8L48.5 44l6.7 6.7 2.8-2.8-9.5-9.5z" fill="#f7d981"/>
              </svg>
            </div>
            <h2 className="redeem-success-title">Parabéns!</h2>
            <p className="redeem-success-text">{redeemFeedback?.message}</p>
            <p className="redeem-success-sub">Valor adicionado ao seu saldo!</p>
            <button
              type="button"
              className="redeem-success-btn"
              onClick={() => setRedeemSuccess(false)}
            >
              Ótimo! ✨
            </button>
          </div>
        </div>
      ) : null}

      {/* ── Modal de boas-vindas ── */}
      {showWelcomeModal ? (
        <div className="welcome-modal-backdrop" onClick={() => setShowWelcomeModal(false)}>
          <div className="welcome-modal-card" onClick={(e) => e.stopPropagation()}>

            <div className="welcome-modal-slides">
              {/* slide 0 — imagem */}
              <div
                className="welcome-modal-slide welcome-modal-slide--down"
                style={{ transform: `translateX(${(0 - modalSlide) * 100}%)` }}
              >
                <img src="/MANCERA.png" alt="Mancera Banner" className="welcome-modal-image" />
              </div>
            </div>

            <button
              type="button"
              className="welcome-modal-btn"
              onClick={() => setShowWelcomeModal(false)}
            >
              Fechar
            </button>
          </div>
        </div>
      ) : null}

    </main>
  )
}
