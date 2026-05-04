import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBalanceSocket } from '../hooks/useBalanceSocket'
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

type CommissionLevel = {
  id: number
  level: number
  name: string
  commissionPercent: number
  isActive: boolean
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

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
            <div className="trk-hero-vip-wrap">
              {currentVip ? (
                <div className="trk-hero-vip">VIP Ativo: {currentVip.name}</div>
              ) : (
                <div className="trk-hero-vip" style={{ background: '#666' }}>Sem VIP</div>
              )}
            </div>
            <h1 className="trk-hero-title">A TRK acredita no potencial do trabalho remoto como ferramenta de inclusão econômica no Brasil.</h1>
            <p className="trk-hero-sub">Por isso, estamos recrutando pessoas interessadas em trabalhar online, com autonomia para escolher quando e onde atuar.</p>
            <div className="trk-hero-glow" />
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
                <span>Parabéns ao membro 619****2611 por recomendar T3 e receber uma recompensa de convite de R$189; </span>
                <span>Parabéns ao membro 539****6924 por recomendar T3 e receber uma recompensa de convite de R$189; </span>
                <span>Parabéns ao membro 639****9228 por recomendar T2 e receber uma recompensa de convite de R$63; </span>
                <span>Parabéns ao membro 819****4692 por recomendar T3 e receber uma recompensa de convite de R$189; </span>
                <span>Parabéns ao membro 219****1863 por recomendar T3 e receber uma recompensa de convite de R$189; </span>
                <span>Parabéns ao membro 559****5064 por recomendar T1 e receber uma recompensa de convite de R$21; </span>
                <span>Parabéns ao membro 159****1206 por recomendar T2 e receber uma recompensa de convite de R$63; </span>
                <span>Parabéns ao membro 479****7125 por recomendar T3 e receber uma recompensa de convite de R$189; </span>
                <span>Parabéns ao membro 659****7727 por recomendar T1 e receber uma recompensa de convite de R$21; </span>
                <span>Parabéns ao membro 499****3880 por recommending T1 e receber uma recompensa de convite de R$21; </span>
                <span>Parabéns ao membro 559****8619 por recomendar T1 e receber uma recompensa de convite de R$21; </span>
                <span>Parabéns ao membro 199****7683 por recomendar T1 e receber uma recompensa de convite de R$21; </span>
                <span>Parabéns ao membro 489****6799 por recomendar T2 e receber uma recompensa de convite de R$63; </span>
                <span>Parabéns ao membro 619****9462 por recomendar T1 e receber uma recompensa de convite de R$21; </span>
                <span>Parabéns ao membro 219****1143 por recomendar T1 e receber uma recompensa de convite de R$21; </span>
                <span>Parabéns ao membro 499****7396 por recomendar T1 e receber uma recompensa de convite de R$21; </span>
                <span>Parabéns ao membro 639****3754 por recomendar T2 e receber uma recompensa de convite de R$63; </span>
                <span>Parabéns ao membro 629****2944 por recommending T1 e receber uma recompensa de convite de R$21; </span>
                <span>Parabéns ao membro 479****1091 por recomendar T1 e receber uma recompensa de convite de R$21; </span>
                <span>Parabéns ao membro 799****1200 por recomendar T1 e receber uma recompensa de convite de R$21; </span>
                <span>Parabéns ao membro 449****4981 por recomendar T3 e receber uma recompensa de convite de R$189; </span>
                <span>Parabéns ao membro 479****9666 por recomendar T2 e receber uma recompensa de convite de R$63; </span>
                <span>Parabéns ao membro 499****3068 por recomendar T3 e receber uma recompensa de convite de R$189; </span>
                <span>Parabéns ao membro 289****9574 por recomendamos T2 e receber uma recompensa de convite de R$63; </span>
                <span>Parabéns ao membro 849****9917 por recomendar T1 e receber uma recompensa de convite de R$21; </span>
                <span>Parabéns ao membro 519****1270 por recomendar T3 e receber uma recompensa de convite de R$189; </span>
                <span>Parabéns ao membro 779****4081 por recomendar T1 e receber uma recompensa de convite de R$21; </span>
                <span>Parabéns ao membro 139****9979 por recomendar T2 e receber uma recompensa de convite de R$63; </span>
                <span>Parabéns ao membro 739****7646 por recomendar T1 e receber uma recompensa de convite de R$21; </span>
                <span>Parabéns ao membro 749****8613 por recomendar T3 e receber uma recompensa de convite de R$189; </span>
                {/* duplicate for seamless loop */}
                <span>Parabéns ao membro 619****2611 por recomendar T3 e receber uma recompensa de convite de R$189; </span>
                <span>Parabéns ao membro 539****6924 por recomendar T3 e receber uma recompensa de convite de R$189; </span>
                <span>Parabéns ao membro 639****9228 por recommendar T2 e receber uma recompensa de convite de R$63; </span>
                <span>Parabéns ao membro 819****4692 por recomendar T3 e receber uma recompensa de convite de R$189; </span>
                <span>Parabéns ao membro 219****1863 por recomendar T3 e receber uma recompensa de convite de R$189; </span>
                <span>Parabéns ao membro 559****5064 por recomendar T1 e receber uma recompensa de convite de R$21; </span>
                <span>Parabéns ao membro 159****1206 por recomendar T2 e receber uma recompensa de convite de R$63; </span>
                <span>Parabéns ao membro 479****7125 por recomendar T3 e receber uma recompensa de convite de R$189; </span>
                <span>Parabéns ao membro 659****7727 por recomendar T1 e receber uma recompensa de convite de R$21; </span>
                <span>Parabéns ao membro 499****3880 por recomendar T1 e receber uma recompensa de convite de R$21; </span>
                <span>Parabéns ao membro 559****8619 por recomendar T1 e receber uma recompensa de convite de R$21; </span>
                <span>Parabéns ao membro 199****7683 por recomendar T1 e receber uma recompensa de convite de R$21; </span>
                <span>Parabéns ao membro 489****6799 por recomendar T2 e receber uma recompensa de convite de R$63; </span>
                <span>Parabéns ao membro 619****9462 por recomendar T1 e receber uma recompensa de convite de R$21; </span>
                <span>Parabéns ao membro 219****1143 por recomendar T1 e receber uma recompensa de convite de R$21; </span>
                <span>Parabéns ao membro 499****7396 por recomendar T1 e receber uma recompensa de convite de R$21; </span>
                <span>Parabéns ao membro 639****3754 por recomendar T2 e receber uma recompensa de convite de R$63; </span>
                <span>Parabéns ao membro 629****2944 por recomendar T1 e receber uma recompensa de convite de R$21; </span>
                <span>Parabéns ao membro 479****1091 por recomendar T1 e receber uma recompensa de convite de R$21; </span>
                <span>Parabéns ao membro 799****1200 por recomendar T1 e receber uma recompensa de convite de R$21; </span>
                <span>Parabéns ao membro 449****4981 por recomendar T3 e receber uma recompensa de convite de R$189; </span>
                <span>Parabéns ao membro 479****9666 por recomendar T2 e receber uma recompensa de convite de R$63; </span>
                <span>Parabéns ao membro 499****3068 por recomendar T3 e receber uma recompensa de convite de R$189; </span>
                <span>Parabéns ao membro 289****9574 por recomendar T2 e receber uma recompensa de convite de R$63; </span>
                <span>Parabéns ao membro 849****9917 por recomendar T1 e receber uma recompensa de convite de R$21; </span>
                <span>Parabéns ao membro 519****1270 por recomendar T3 e receber uma recompensa de convite de R$189; </span>
                <span>Parabéns ao membro 779****4081 por recomendar T1 e receber uma recompensa de convite de R$21; </span>
                <span>Parabéns ao membro 139****9979 por recomendar T2 e receber uma recompensa de convite de R$63; </span>
                <span>Parabéns ao membro 739****7646 por recomendar T1 e receber uma recompensa de convite de R$21; </span>
                <span>Parabéns ao membro 749****8613 por recomendar T3 e receber uma recompensa de convite de R$189; </span>
              </div>
            </div>
          </div>

          {/* ── Recarga / Saque ── */}
          <div style={{ marginLeft: '10px', marginTop: '12px' }}>
            <div
              className="landscape-btn deposit"
              style={{ width: '47%', display: 'inline-block' }}
              onClick={() => navigate('/cashin')}
            >
              <span>Recarga</span>
            </div>
            <div
              className="landscape-btn withdraw"
              style={{ width: '47%', display: 'inline-block', marginLeft: '10px' }}
              onClick={() => navigate('/saque')}
            >
              <span>Saque</span>
            </div>
          </div>

          {/* ── Menu de navegação ── */}
          <section className="dash-menu-grid">
            <div className="dash-menu-item" onClick={() => navigate('/cycle-products')}>
              <div className="dash-menu-icon">
                <svg viewBox="0 0 24 24" fill="#ff8a03"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.58 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/></svg>
              </div>
              <span>Valorização do fundo</span>
            </div>
            <div className="dash-menu-item" onClick={() => navigate('/roleta')}>
              <div className="dash-menu-icon">
                <svg viewBox="0 0 24 24" fill="#ff8a03"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>
              </div>
              <span>Sorteio da Sorte</span>
            </div>
            <div className="dash-menu-item" onClick={() => navigate('/tasks')}>
              <div className="dash-menu-icon">
                <svg viewBox="0 0 24 24" fill="#ff8a03"><path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/></svg>
              </div>
              <span>Trabalho</span>
            </div>
            <div className="dash-menu-item" onClick={() => setShowEnvelopeModal(true)}>
              <div className="dash-menu-icon">
                <svg viewBox="0 0 24 24" fill="#ff8a03"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
              </div>
              <span>Envelope vermelho</span>
            </div>
            <div className="dash-menu-item" onClick={() => navigate('/about')}>
              <div className="dash-menu-icon">
                <svg viewBox="0 0 24 24" fill="#ff8a03"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
              </div>
              <span>Sobre Nós</span>
            </div>
            <div className="dash-menu-item" onClick={() => navigate('/introducao')}>
              <div className="dash-menu-icon">
                <svg viewBox="0 0 24 24" fill="#ff8a03"><path d="M21 3H3c-1.11 0-2 .89-2 2v12c0 1.1.89 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.11-.9-2-2-2zm0 14H3V5h18v12zM10 7l5 4-5 4V7z"/></svg>
              </div>
              <span>Introdução</span>
            </div>
            <div className="dash-menu-item" onClick={() => navigate('/manual')}>
              <div className="dash-menu-icon">
                <svg viewBox="0 0 24 24" fill="#ff8a03"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>
              </div>
              <span>Manual de Ajuda</span>
            </div>
                      </section>

          {/* ── Sobre a TRK ── */}
          <section className="trk-about-section">
            <div className="trk-about-photo-row">
              <div className="trk-about-photo-wrap">
                <img src="/trk-team-1.png" alt="Equipe TRK" className="trk-about-photo" />
              </div>
              <div className="trk-about-photo-wrap">
                <img src="/trk-team-2.png" alt="TRK Plataforma" className="trk-about-photo" />
              </div>
            </div>
            <div className="trk-about-text">
              <h1 className="trk-about-title">Conheça a TRK</h1>
              <p>A TRK está comprometida em melhorar a qualidade de vida do povo brasileiro por meio da oferta de oportunidades de emprego.</p>
              <p>Estamos recrutando ativamente trabalhadores online no Brasil, oferecendo horários e locais de trabalho flexíveis.</p>
              <p>Os colaboradores online podem desfrutar de uma grande variedade de imagens fotográficas em nossa plataforma e concluir tarefas para receber comissões.</p>
              <p>Nossa plataforma online não apenas oferece uma rica diversidade de recursos fotográficos, como também cria uma importante fonte de renda para os colaboradores online, permitindo que trabalhem com conforto em casa.</p>
            </div>
          </section>
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
                <img src="/trkbann.png" alt="TRK Banner" className="welcome-modal-image" />
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
