import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import { useBalanceSocket, type BalanceData } from '../hooks/useBalanceSocket'
import './Dashboard.css'
import './Profile.css'

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
    avatarUrl?: string
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
    totalWithdrawals?: number
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

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatVipExpiry = (raw: string | null): { label: string; status: 'active' | 'expired' | 'none' } => {
  if (!raw) return { label: 'Sem VIP ativo', status: 'none' }
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return { label: 'Sem VIP ativo', status: 'none' }

  const now = new Date()
  const expired = date.getTime() < now.getTime()
  const formatted = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  if (expired) return { label: `Expirou em ${formatted}`, status: 'expired' }

  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  const suffix = diffDays === 1 ? '1 dia restante' : `${diffDays} dias restantes`
  return { label: `${formatted} • ${suffix}`, status: 'active' }
}


export default function Profile() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState(0)
  const [totalDeposits, setTotalDeposits] = useState(0)
  const [withdrawableBalance, setWithdrawableBalance] = useState(0)
  const [todayIncome, setTodayIncome] = useState(0)
  const [teamTotal, setTeamTotal] = useState(0)
  const [totalWithdrawals, setTotalWithdrawals] = useState(0)
  const [userBadge, setUserBadge] = useState('Estagiário')
  const [vipLevelName, setVipLevelName] = useState('')
  const [vipExpiresAt, setVipExpiresAt] = useState<string | null>(null)
  const [vipImageUrl, setVipImageUrl] = useState('')
  const [copyFeedback, setCopyFeedback] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [_monthlySalaryContract, setMonthlySalaryContract] = useState('')
  const [redeemFeedback, _setRedeemFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [showRedeemSuccessModal, setShowRedeemSuccessModal] = useState(false)
  const [redeemSuccessData, _setRedeemSuccessData] = useState<{ message: string; rewardValue: number; code: string } | null>(null)

  const normalizedBadge = useMemo(() => userBadge.toLowerCase(), [userBadge])

  const badgeTheme = useMemo(() => {
    if (normalizedBadge.includes('diam')) return 'diamond'
    if (normalizedBadge.includes('ouro') || normalizedBadge.includes('gold')) return 'gold'
    if (normalizedBadge.includes('prata') || normalizedBadge.includes('silver')) return 'silver'
    if (normalizedBadge.includes('bronze')) return 'bronze'
    if (normalizedBadge.includes('vip')) return 'vip'
    if (normalizedBadge.includes('estagiário') || normalizedBadge.includes('estagiario')) return 'regular'
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

  // WebSocket: atualiza saldos em tempo real
  const handleBalanceUpdate = useCallback((data: BalanceData) => {
    setBalance(data.balance)
    setWithdrawableBalance(data.commissionBalance)
    setTotalDeposits(data.totalDeposits)
  }, [])

  useBalanceSocket(user?.id, handleBalanceUpdate)

  useEffect(() => {
    if (!user?.id) {
      navigate('/')
      return
    }

    const loadProfile = async () => {
      setLoading(true)
      const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''
      const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
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
          if (vipData?.ok && vipData?.hasVip && vipData.vip) {
            const lvlName = String(vipData.vip.levelName ?? '').trim()
            setVipLevelName(lvlName)
            setUserBadge(lvlName || 'Estagiário')
            setVipExpiresAt(vipData.vip.expiresAt ?? null)
            setVipImageUrl(String(vipData.vip.avatarUrl ?? ''))
            if (typeof vipData.balance === 'number') {
              setBalance(Number(vipData.balance))
            }
          } else {
            setVipLevelName('')
            setUserBadge('Estagiário')
            setVipExpiresAt(null)
            setVipImageUrl('')
          }
        }

        if (miniTasksRes.ok) {
          await miniTasksRes.json().catch(() => null)
        }

        if (metricsRes.ok) {
          const metricsData = (await metricsRes.json()) as ProfileMetricsResponse
          const metrics = metricsData?.metrics
          if (metrics) {
            setWithdrawableBalance(Number(metrics.withdrawableBalance ?? 0))
            setTodayIncome(Number(metrics.todayIncome ?? 0))
            setTeamTotal(Number(metrics.teamTotal ?? 0))
            setTotalWithdrawals(Number(metrics.totalWithdrawals ?? 0))
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

  // Gift code redeem — feature kept for future activation
  // (UI wiring needed before enabling)

  return (
    <main className="dash-app profile-page">
      <section className="dash-main">
        <AppSidebar />

        <div className="dash-content">
          {loading ? (
            <div className="profile-loading">Carregando perfil...</div>
          ) : (
            <>
              <div className="profile-banner-top">
                <img src="/trk-banner.png" alt="TRK Banner" className="profile-banner-img" />
              </div>

              <section className="profile-header-modern">
                <div className="profile-header-row">
                  <button type="button" className="profile-avatar-btn" aria-label="Selecionar Avatar">
                    <div className="profile-avatar-frame">
                      <img
                        alt="Avatar do usuário"
                        className="profile-avatar-img"
                        src={
                          vipImageUrl
                            ? (vipImageUrl.startsWith('http') ? vipImageUrl : `${API_URL}${vipImageUrl}`)
                            : `https://api.dicebear.com/7.x/personas/svg?seed=${user?.id ?? 'default'}-${user?.phone ?? user?.name ?? 'user'}`
                        }
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
                        <span className="profile-vip-pill-text">{vipLevelName || 'Estagiário'}</span>
                        <svg viewBox="0 0 24 24" className="profile-vip-pill-icon" aria-hidden="true">
                          <path d="M9 6l6 6l-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>

                    <div className="profile-invite-row">
                      <span>Convite:</span>
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
                      <span>Vigência:</span>
                      <span
                        className={`profile-invite-code profile-vip-expiry profile-vip-expiry--${formatVipExpiry(vipExpiresAt).status}`}
                      >
                        {formatVipExpiry(vipExpiresAt).label}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="profile-wallet-card">
                <div className="profile-wallet-item">
                  <div className="profile-wallet-value">{formatBRL(balance)}</div>
                  <div className="profile-wallet-label">Saldo (R$)</div>
                </div>
                <div className="profile-wallet-divider" />
                <div className="profile-wallet-item">
                  <div className="profile-wallet-value">{formatBRL(withdrawableBalance)}</div>
                  <div className="profile-wallet-label">Comissão (R$)</div>
                </div>
                <div className="profile-wallet-divider" />
                <div className="profile-wallet-item">
                  <div className="profile-wallet-value">{formatBRL(totalDeposits)}</div>
                  <div className="profile-wallet-label">Recarga (R$)</div>
                </div>
              </section>

              <section className="profile-stats-grid">
                <div className="profile-stat-card">
                  <p className="profile-stat-value">{formatBRL(todayIncome)}</p>
                  <p className="profile-stat-label">Receita total(R$)</p>
                </div>
                <div className="profile-stat-card">
                  <p className="profile-stat-value">{formatBRL(withdrawableBalance)}</p>
                  <p className="profile-stat-label">Ganhos totais(R$)</p>
                </div>
                <div className="profile-stat-card">
                  <p className="profile-stat-value">{formatBRL(totalDeposits)}</p>
                  <p className="profile-stat-label">Depósitos acumulados(R$)</p>
                </div>
                <div className="profile-stat-card">
                  <p className="profile-stat-value">{formatBRL(totalWithdrawals)}</p>
                  <p className="profile-stat-label">Saques acumulados(R$)</p>
                </div>
                <div className="profile-stat-card profile-stat-card-full">
                  <p className="profile-stat-value">{teamTotal}</p>
                  <p className="profile-stat-label">Total de membros(Individual)</p>
                </div>
              </section>

              <section className="profile-menu-grid">
                <button type="button" className="profile-menu-item" onClick={() => navigate('/registros-tarefas')}>
                  <div className="profile-menu-icon-wrap">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M14 3v4a1 1 0 0 0 1 1h4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M17 21h-10a2 2 0 0 1-2-2v-14a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M9 13h6M9 17h6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="profile-menu-label">Registros de Trabalho</span>
                </button>
                <button type="button" className="profile-menu-item" onClick={() => navigate('/registro-do-dia')}>
                  <div className="profile-menu-icon-wrap">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="3" y="5" width="18" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
                      <path d="M3 9h18" fill="none" stroke="currentColor" strokeWidth="2" />
                      <path d="M8 3v4M16 3v4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M8 14h3M8 17h6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="profile-menu-label">Registro do dia</span>
                </button>
                <button type="button" className="profile-menu-item" onClick={() => navigate('/position')}>
                  <div className="profile-menu-icon-wrap">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="9" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
                      <circle cx="16.5" cy="9" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
                      <path d="M4 19a5 5 0 0 1 10 0M14 19a4.5 4.5 0 0 1 6 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="profile-menu-label">Relatórios da Equipe</span>
                </button>
                <button type="button" className="profile-menu-item" onClick={() => navigate('/monthly-salary')}>
                  <div className="profile-menu-icon-wrap">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M4 19h16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M7 16V9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M12 16V6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M17 16v-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="profile-menu-label">Registros Contábeis</span>
                </button>
                <button type="button" className="profile-menu-item" onClick={() => navigate('/statement')}>
                  <div className="profile-menu-icon-wrap">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M3 17l4-8l5 6l3-4l4 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M3 20h18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="profile-menu-label">Extrato</span>
                </button>
                <button type="button" className="profile-menu-item" onClick={() => navigate('/bank-cards')}>
                  <div className="profile-menu-icon-wrap">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="3" y="5" width="18" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
                      <path d="M3 10h18" fill="none" stroke="currentColor" strokeWidth="2" />
                      <path d="M7 15h.01M11 15h2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="profile-menu-label">Centros de Crédito</span>
                </button>
                <button type="button" className="profile-menu-item">
                  <div className="profile-menu-icon-wrap">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 4v12M7 11l5 5l5-5M4 20h16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="profile-menu-label">Baixar Aplicativo</span>
                </button>
                <button type="button" className="profile-menu-item" onClick={() => navigate('/invite')}>
                  <div className="profile-menu-icon-wrap">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="9" cy="7" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
                      <path d="M19 8v6M22 11h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="profile-menu-label">Convidar</span>
                </button>
                <button type="button" className="profile-menu-item" onClick={() => navigate('/checkin')}>
                  <div className="profile-menu-icon-wrap">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="3" y="8" width="18" height="4" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
                      <path d="M12 8v13M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" fill="none" stroke="currentColor" strokeWidth="2" />
                      <path d="M7.5 8a2.5 2.5 0 0 1 0-5A5 5 0 0 1 12 8a5 5 0 0 1 4.5-5a2.5 2.5 0 0 1 0 5" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </div>
                  <span className="profile-menu-label">Check-in</span>
                </button>
                <button type="button" className="profile-menu-item" onClick={() => navigate('/withdraw-password')}>
                  <div className="profile-menu-icon-wrap">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 3a11 11 0 0 0 8 3.5c0 6-2.8 11.2-8 14.5c-5.2-3.3-8-8.5-8-14.5A11 11 0 0 0 12 3z" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </div>
                  <span className="profile-menu-label">Senha do Fundo</span>
                </button>
                <button type="button" className="profile-menu-item" onClick={() => navigate('/change-password')}>
                  <div className="profile-menu-icon-wrap">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M4 20h4l10-10a2.1 2.1 0 1 0-3-3L5 17v3z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                      <path d="M13.5 6.5l3 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="profile-menu-label">Alterar Senha</span>
                </button>
                <button type="button" className="profile-menu-item logout" onClick={handleLogout}>
                  <div className="profile-menu-icon-wrap">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M14 4h-7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M10 12h10M17 8l4 4l-4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="profile-menu-label">Sair</span>
                </button>
              </section>
            </>
          )}
        </div>
      </section>

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
    </main>
  )
}
