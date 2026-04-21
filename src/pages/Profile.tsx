import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import './Profile.css'
import './Tasks.css'

type StoredUser = {
  id: number
  name: string
  phone: string
}

type VipResponse = {
  ok?: boolean
  hasVip?: boolean
  vip?: {
    levelName?: string
    vipPrice?: number
    expiresAt?: string | null
  } | null
  balance?: number
}

type SummaryResponse = {
  balance?: number
  totalDeposits?: number
  monthlySalaryContract?: string | null
}

type ProfileMetricsResponse = {
  ok?: boolean
  metrics?: {
    teamTotal?: number
    withdrawableBalance?: number
    todayIncome?: number
    hasActiveCyclePlan?: boolean
    activeCyclePlan?: {
      id?: number
      productName?: string
      amountPaid?: number
      expectedProfit?: number
      cycleDays?: number
      startedAt?: string | null
      endsAt?: string | null
    } | null
  }
}

type MiniTasksBadgeResponse = {
  ok?: boolean
  badges?: string[]
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })


export default function Profile() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState(0)
  const [totalDeposits, setTotalDeposits] = useState(0)
  const [withdrawableBalance, setWithdrawableBalance] = useState(0)
  const [todayIncome, setTodayIncome] = useState(0)
  const [userBadge, setUserBadge] = useState('Usuário regular')
  const [copyFeedback, setCopyFeedback] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [monthlySalaryContract, setMonthlySalaryContract] = useState('')
  const [giftCodeInput, setGiftCodeInput] = useState('')
  const [redeemLoading, setRedeemLoading] = useState(false)
  const [redeemFeedback, setRedeemFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [showRedeemSuccessModal, setShowRedeemSuccessModal] = useState(false)
  const [redeemSuccessData, setRedeemSuccessData] = useState<{ message: string; rewardValue: number; code: string } | null>(null)

  const normalizedBadge = useMemo(() => userBadge.toLowerCase(), [userBadge])

  const badgeTheme = useMemo(() => {
    if (normalizedBadge.includes('diam')) return 'diamond'
    if (normalizedBadge.includes('ouro') || normalizedBadge.includes('gold')) return 'gold'
    if (normalizedBadge.includes('prata') || normalizedBadge.includes('silver')) return 'silver'
    if (normalizedBadge.includes('bronze')) return 'bronze'
    if (normalizedBadge.includes('vip')) return 'vip'
    return 'regular'
  }, [normalizedBadge])

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
    if (!user?.id) {
      navigate('/')
      return
    }

    const loadProfile = async () => {
      setLoading(true)
      const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}
      try {
        const [summaryRes, vipRes, metricsRes, miningRes, miniTasksRes] = await Promise.all([
          fetch(`${API_URL}/api/user/summary/${user.id}`, { headers: authHeaders }),
          fetch(`${API_URL}/api/vip/user/${user.id}`, { headers: authHeaders }),
          fetch(`${API_URL}/api/profile/metrics/${user.id}`, { headers: authHeaders }),
          fetch(`${API_URL}/api/mining/tasks/${user.id}`, { headers: authHeaders }),
          fetch(`${API_URL}/api/mini-tasks/${user.id}`, { headers: authHeaders }),
        ])

        if (summaryRes.ok) {
          const summaryData = (await summaryRes.json()) as SummaryResponse
          setBalance(Number(summaryData.balance ?? 0))
          setTotalDeposits(Number(summaryData.totalDeposits ?? 0))
          setMonthlySalaryContract(String(summaryData.monthlySalaryContract ?? '').trim())
        }

        if (vipRes.ok) {
          const vipData = (await vipRes.json()) as VipResponse
          if (vipData?.ok && vipData?.hasVip && vipData.vip && typeof vipData.balance === 'number') {
            setBalance(Number(vipData.balance))
          }
        }

        if (miniTasksRes.ok) {
          const miniTasksData = (await miniTasksRes.json()) as MiniTasksBadgeResponse
          if (miniTasksData?.ok && Array.isArray(miniTasksData.badges) && miniTasksData.badges.length > 0) {
            const parsedBadges = miniTasksData.badges
              .map((item) => String(item ?? '').trim())
              .filter((item) => item.length > 0)
            const latestBadge = parsedBadges[parsedBadges.length - 1]
            setUserBadge(latestBadge || 'Sem badge')
          } else {
            setUserBadge('Sem badge')
          }
        } else {
          setUserBadge('Sem badge')
        }

        if (metricsRes.ok) {
          const metricsData = (await metricsRes.json()) as ProfileMetricsResponse
          const metrics = metricsData?.metrics
          if (metrics) {
            setWithdrawableBalance(Number(metrics.withdrawableBalance ?? 0))
            setTodayIncome(Number(metrics.todayIncome ?? 0))
          }
        }

        // miningRes ainda é feito (para não quebrar outros usos), mas todayIncome vem de metrics
        if (miningRes.ok) {
          await miningRes.json().catch(() => null)
        }

        const referralRes = await fetch(`${API_URL}/api/referral/${user.id}`)
        const referralData = await referralRes.json()
        if (referralRes.ok && referralData?.ok) {
          setInviteCode(String(referralData.referralCode ?? ''))
        } else {
          setInviteCode('')
        }
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [navigate, user?.id])

  const copyInviteCode = async () => {
    try {
      if (!inviteCode) {
        setCopyFeedback('Sem código')
        setTimeout(() => setCopyFeedback(''), 1500)
        return
      }
      await navigator.clipboard.writeText(inviteCode)
      setCopyFeedback('Copiado!')
      setTimeout(() => setCopyFeedback(''), 1500)
    } catch {
      setCopyFeedback('Erro ao copiar')
      setTimeout(() => setCopyFeedback(''), 1500)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    navigate('/')
  }

  const redeemGiftCode = async () => {
    if (!user?.id) {
      setRedeemFeedback({ type: 'error', message: 'Usuário não autenticado.' })
      return
    }

    const code = giftCodeInput.trim().toUpperCase()
    if (!code) {
      setRedeemFeedback({ type: 'error', message: 'Informe um código válido.' })
      return
    }

    setRedeemLoading(true)
    setRedeemFeedback(null)

    try {
      const token = localStorage.getItem('token') ?? sessionStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/gift-codes/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId: user.id,
          code,
        }),
      })

      const data = await res.json() as {
        ok?: boolean
        error?: string
        message?: string
        balance?: number
        rewardValue?: number
      }

      if (!res.ok || !data?.ok) {
        setRedeemFeedback({
          type: 'error',
          message: data?.error || 'Não foi possível resgatar o código.',
        })
        setTimeout(() => setRedeemFeedback(null), 2500)
        return
      }

      if (typeof data.balance === 'number') {
        setBalance(Number(data.balance))
      }

      setGiftCodeInput('')
      const rewardValue = typeof data.rewardValue === 'number' ? Number(data.rewardValue) : 0
      const successMessage = data?.message || 'Código resgatado com sucesso!'
      setRedeemSuccessData({
        message: successMessage,
        rewardValue,
        code,
      })
      setShowRedeemSuccessModal(true)
    } catch {
      setRedeemFeedback({
        type: 'error',
        message: 'Erro de conexão ao resgatar código.',
      })
      setTimeout(() => setRedeemFeedback(null), 2500)
    } finally {
      setRedeemLoading(false)
    }
  }

  return (
    <main className="tasks-page profile-page">
      {redeemFeedback ? (
        <div className={`gift-toast ${redeemFeedback.type === 'success' ? 'success' : 'error'}`} role="status" aria-live="polite">
          {redeemFeedback.message}
        </div>
      ) : null}
      {showRedeemSuccessModal && redeemSuccessData ? (
        <div className="redeem-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="redeem-success-title">
          <div className="redeem-modal-confetti-layer" aria-hidden="true">
            {Array.from({ length: 28 }).map((_, i) => (
              <span key={i} className={`confetti confetti-${(i % 7) + 1}`} />
            ))}
          </div>

          <div className="redeem-modal-card">
            <div className="redeem-modal-badge">🎉 Sucesso</div>
            <h2 id="redeem-success-title">Código resgatado!</h2>
            <p className="redeem-modal-message">{redeemSuccessData.message}</p>
            <div className="redeem-modal-highlight">
              <span>Valor resgatado</span>
              <strong>{formatBRL(redeemSuccessData.rewardValue)}</strong>
            </div>
            <p className="redeem-modal-code">Código: <b>{redeemSuccessData.code}</b></p>
            <button
              type="button"
              className="redeem-modal-btn"
              onClick={() => setShowRedeemSuccessModal(false)}
            >
              Continuar
            </button>
          </div>
        </div>
      ) : null}
      <AppSidebar />
      <header className="tasks-header">
        <div>
          <p className="tasks-kicker">Conta</p>
          <h1>Perfil</h1>
          <span className="tasks-subtitle">Informações da sua conta e status VIP</span>
        </div>
        <div className="tasks-header-actions">
          <button className="btn ghost" onClick={() => navigate('/dashboard')}>
            Voltar
          </button>
        </div>
      </header>

      {loading ? (
        <div className="vip-inline-message">Carregando perfil...</div>
      ) : (
        <>
          <section className="profile-header-modern">
            <div className="profile-header-row">
              <button type="button" className="profile-avatar-btn" aria-label="Selecionar Avatar">
                <div className="profile-avatar-frame">
                  <img
                    alt="Avatar do usuário"
                    className="profile-avatar-img"
                    src="https://api.dicebear.com/7.x/personas/svg?seed=avatar-user"
                  />
                </div>
              </button>

              <div className="profile-header-info">
                <div className="profile-header-topline">
                  <h2 className="profile-header-name">{user?.phone ?? user?.name ?? 'Usuário'}</h2>
                  <span className={`profile-user-badge profile-user-badge-${badgeTheme}`} aria-label="Badge do usuário">
                    <span className="profile-user-badge-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="M12 2l7 3v6c0 5-3.4 9.3-7 11c-3.6-1.7-7-6-7-11V5l7-3z" fill="currentColor" />
                        <path d="M12 6.2l3.2 1.4v3.1c0 2.3-1.3 4.5-3.2 5.7c-1.9-1.2-3.2-3.4-3.2-5.7V7.6L12 6.2z" fill="rgba(255,255,255,0.45)" />
                      </svg>
                    </span>
                    <span className="profile-user-badge-text">{userBadge}</span>
                  </span>
                  <button
                    type="button"
                    className="profile-vip-pill"
                    aria-label="View VIP benefits"
                  >
                    <span className="profile-vip-pill-text">Usuários regulares</span>
                    <svg viewBox="0 0 24 24" className="profile-vip-pill-icon" aria-hidden="true">
                      <path d="M9 6l6 6l-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>

                <div className="profile-invite-row">
                  <span>Código de Convite:</span>
                  <span className="profile-invite-code">{inviteCode}</span>
                  <button
                    type="button"
                    className="profile-copy-btn"
                    aria-label="Copiar código de convite"
                    onClick={copyInviteCode}
                  >
                    <svg viewBox="0 0 24 24" className="profile-copy-icon" aria-hidden="true">
                      <path d="M7 7m0 2.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {copyFeedback ? <span className="profile-copy-feedback">{copyFeedback}</span> : null}
                </div>

                <div className="profile-invite-row">
                  <span>Contrato Atual:</span>
                  <span className="profile-invite-code">{monthlySalaryContract || 'Sem contrato ativo'}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="profile-summary-top">
            <div className="profile-summary-grid">
              <div className="profile-summary-item" role="presentation">
                <div className="profile-summary-value">
                  {formatBRL(balance)}
                </div>
                <div className="profile-summary-label">Saldo Total</div>
              </div>
              <div className="profile-summary-item profile-summary-item-border">
                <div className="profile-summary-value">
                  {formatBRL(totalDeposits)}
                </div>
                <div className="profile-summary-label">Receita Total</div>
              </div>
            </div>
          </section>

          <section className="home-shortcuts-sky-bg">
            <div className="home-shortcuts-grid">
              <div className="shortcut-cell">
                <div className="shortcut-value">{formatBRL(totalDeposits)}</div>
                <div className="shortcut-label">Conta de Recarga</div>
              </div>
              <div className="shortcut-cell shortcut-cell-left-border">
                <div className="shortcut-value">{formatBRL(withdrawableBalance)}</div>
                <div className="shortcut-label">Conta de Recompensas</div>
              </div>
              <div className="shortcut-cell shortcut-cell-top-border">
                <div className="shortcut-value">{formatBRL(0)}</div>
                <div className="shortcut-label">Total Sacado</div>
              </div>
              <div className="shortcut-cell shortcut-cell-left-border shortcut-cell-top-border">
                <div className="shortcut-value">{formatBRL(todayIncome)}</div>
                <div className="shortcut-label">Receita de Hoje</div>
              </div>
            </div>
          </section>

          <section className="gift-redeem-card">
            <div className="gift-redeem-head">
              <div className="gift-redeem-icon-wrap">
                <svg viewBox="0 0 24 24" className="gift-redeem-icon" aria-hidden="true">
                  <path d="M3 9a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 8v13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5a2.5 2.5 0 0 1 0 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div className="gift-redeem-copy">
                <h3>Resgatar Código de Presente</h3>
                <p>Informe o código para reivindicar recompensas</p>
              </div>
              <svg viewBox="0 0 24 24" className="gift-redeem-spark" aria-hidden="true">
                <path d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2-2a2 2 0 0 1-2-2a2 2 0 0 1-2 2zm0-12a2 2 0 0 1 2 2a2 2 0 0 1 2-2a2 2 0 0 1-2-2a2 2 0 0 1-2 2zm-7 12a6 6 0 0 1 6-6a6 6 0 0 1-6-6a6 6 0 0 1-6 6a6 6 0 0 1 6 6z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div className="gift-redeem-actions">
              <div className="gift-redeem-input-wrap">
                <input
                  placeholder="Informe o código do presente"
                  className="gift-redeem-input"
                  maxLength={20}
                  type="text"
                  value={giftCodeInput}
                  onChange={(e) => setGiftCodeInput(e.target.value.toUpperCase())}
                />
              </div>
              <button
                type="button"
                disabled={redeemLoading || !giftCodeInput.trim()}
                className="gift-redeem-btn"
                onClick={redeemGiftCode}
              >
                {redeemLoading ? 'Resgatando...' : 'Reivindicar'}
              </button>
            </div>
          </section>

          <section className="profile-shortcuts-grid">
            <button type="button" className="profile-shortcut-btn" onClick={() => navigate('/investment-orders')}>
              <svg className="profile-shortcut-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M14 3v4a1 1 0 0 0 1 1h4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M17 21h-10a2 2 0 0 1-2-2v-14a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M9 13h6M9 17h6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="profile-shortcut-label">Pedidos de Investimento</span>
            </button>
            <button type="button" className="profile-shortcut-btn" onClick={() => navigate('/monthly-salary')}>
              <svg className="profile-shortcut-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 19h16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M7 16V9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M12 16V6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M17 16v-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="profile-shortcut-label">Salário Mensal</span>
            </button>
            <button type="button" className="profile-shortcut-btn" onClick={() => navigate('/earnings')}>
              <svg className="profile-shortcut-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 20h18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <rect x="4" y="12" width="4" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
                <rect x="10" y="5" width="4" height="14" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
                <rect x="16" y="9" width="4" height="10" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
              <span className="profile-shortcut-label">Ganhos</span>
            </button>
            <button type="button" className="profile-shortcut-btn" onClick={() => navigate('/bank-cards')}>
              <svg className="profile-shortcut-icon" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M3 10h18" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M7 15h.01M11 15h2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="profile-shortcut-label">Cartões Bancários</span>
            </button>
            <button type="button" className="profile-shortcut-btn" onClick={() => navigate('/team-report')}>
              <svg className="profile-shortcut-icon" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="5" y="4" width="14" height="17" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M9 8h6M9 12h6M9 16h4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="profile-shortcut-label">Relatório da Equipe</span>
            </button>
            <button type="button" className="profile-shortcut-btn" onClick={() => navigate('/invite')}>
              <svg className="profile-shortcut-icon" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="9" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
                <circle cx="16.5" cy="9" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M4 19a5 5 0 0 1 10 0M14 19a4.5 4.5 0 0 1 6 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="profile-shortcut-label">Convidar</span>
            </button>
            <button type="button" className="profile-shortcut-btn" onClick={() => navigate('/mini-tasks')}>
              <svg className="profile-shortcut-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 11l2 2l4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="3" y="4" width="18" height="16" rx="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M7 8h10M7 16h6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="profile-shortcut-label">Mini tarefas</span>
            </button>
            <button type="button" className="profile-shortcut-btn" onClick={() => navigate('/vip-rules')}>
              <svg className="profile-shortcut-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 17l4-8l5 6l3-4l4 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 20h18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="profile-shortcut-label">Regras VIP</span>
            </button>
            <button type="button" className="profile-shortcut-btn" onClick={() => navigate('/community')}>
              <svg className="profile-shortcut-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M21 12a8.5 8.5 0 0 1-8.5 8.5A8.6 8.6 0 0 1 8 19l-5 1.5L4.5 16A8.5 8.5 0 1 1 21 12z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              </svg>
              <span className="profile-shortcut-label">Comunidade</span>
            </button>
            <button type="button" className="profile-shortcut-btn" onClick={() => navigate('/checkin')}>
              <svg className="profile-shortcut-icon" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="8" width="18" height="4" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M12 8v13M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M7.5 8a2.5 2.5 0 0 1 0-5A5 5 0 0 1 12 8a5 5 0 0 1 4.5-5a2.5 2.5 0 0 1 0 5" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
              <span className="profile-shortcut-label">Check-in</span>
            </button>
            <button type="button" className="profile-shortcut-btn" onClick={() => navigate('/withdraw-password')}>
              <svg className="profile-shortcut-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3a11 11 0 0 0 8 3.5c0 6-2.8 11.2-8 14.5c-5.2-3.3-8-8.5-8-14.5A11 11 0 0 0 12 3z" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
              <span className="profile-shortcut-label">Senha do Fundo</span>
            </button>
            <button type="button" className="profile-shortcut-btn">
              <svg className="profile-shortcut-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 10a6 6 0 1 0-12 0v4a3 3 0 0 1-2 2h16a3 3 0 0 1-2-2v-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M9.5 19a2.5 2.5 0 0 0 5 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="profile-shortcut-label">Notificações</span>
            </button>
            <button type="button" className="profile-shortcut-btn" onClick={() => navigate('/tax-declaration')}>
              <svg className="profile-shortcut-icon" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              </svg>
              <span className="profile-shortcut-label">Imposto de Renda</span>
            </button>
            <button type="button" className="profile-shortcut-btn">
              <svg className="profile-shortcut-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 4v12M7 11l5 5l5-5M4 20h16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="profile-shortcut-label">Baixar APP</span>
            </button>
            <button type="button" className="profile-shortcut-btn" onClick={() => navigate('/change-password')}>
              <svg className="profile-shortcut-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 20h4l10-10a2.1 2.1 0 1 0-3-3L5 17v3z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                <path d="M13.5 6.5l3 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="profile-shortcut-label">Alterar Senha</span>
            </button>
            <button type="button" className="profile-shortcut-btn" onClick={() => navigate('/gift-vouchers')}>
              <svg className="profile-shortcut-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 9a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 8v13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5a2.5 2.5 0 0 1 0 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="profile-shortcut-label">Cartões Presentes</span>
            </button>
            <button type="button" className="profile-shortcut-btn" onClick={() => navigate('/caixas-box')}>
              <svg className="profile-shortcut-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 3v4a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V3H7z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M7 21v-6a1 1 0 0 0 1-1h8a1 1 0 0 0 1 1v6H7z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M7 14h10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M12 3v18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="profile-shortcut-label">Caixas Box</span>
            </button>
            <button type="button" className="profile-shortcut-btn logout" onClick={handleLogout}>
              <svg className="profile-shortcut-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M14 4h-7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M10 12h10M17 8l4 4l-4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="profile-shortcut-label">Sair</span>
            </button>
          </section>
        </>
      )}

    </main>
  )
}
