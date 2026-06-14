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
  mancecoinBalance?: number
}

type ProfileMetricsResponse = {
  ok?: boolean
  metrics?: {
    teamTotal?: number
    withdrawableBalance?: number
    todayIncome?: number
    totalIncome?: number
    totalWithdrawals?: number
    cycleIncome?: number
    teamIncome?: number
    otherIncome?: number
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

const formatNum = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const maskPhone = (phone: string) => {
  if (!phone || phone.length < 8) return phone
  return phone.slice(0, 3) + '****' + phone.slice(-4)
}

export default function Profile() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState(0)
  const [totalDeposits, setTotalDeposits] = useState(0)
  const [withdrawableBalance, setWithdrawableBalance] = useState(0)
  const [rechargeBalance, setRechargeBalance] = useState(0)
  const [todayIncome, setTodayIncome] = useState(0)
  const [teamTotal, setTeamTotal] = useState(0)
  const [vipLevelName, setVipLevelName] = useState('')
  const [vipImageUrl, setVipImageUrl] = useState('')
  const [activeProductName, setActiveProductName] = useState('')
  const [_monthlySalaryContract, setMonthlySalaryContract] = useState('')
  const [showRedeemSuccessModal, setShowRedeemSuccessModal] = useState(false)
  const [redeemSuccessData, _setRedeemSuccessData] = useState<{ message: string; rewardValue: number; code: string } | null>(null)
  const [mancecoinBalance, setMancecoinBalance] = useState(0)
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalWithdrawals, setTotalWithdrawals] = useState(0)
  const [cycleIncome, setCycleIncome] = useState(0)
  const [teamIncome, setTeamIncome] = useState(0)
  const [otherIncome, setOtherIncome] = useState(0)
  const [commissionLevels, setCommissionLevels] = useState<Array<{ level: number; commissionPercent: number }>>([])


  const user = useMemo(() => {
    const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')
    if (!raw) return null
    try { return JSON.parse(raw) as StoredUser } catch { return null }
  }, [])

  const handleBalanceUpdate = useCallback((data: BalanceData) => {
    setBalance(data.balance)
    setWithdrawableBalance(data.commissionBalance)
    setTotalDeposits(data.totalDeposits)
    setRechargeBalance(data.rechargeBalance)
  }, [])

  useBalanceSocket(user?.id, handleBalanceUpdate)

  useEffect(() => {
    if (!user?.id) { navigate('/'); return }

    const loadProfile = async () => {
      setLoading(true)
      const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''
      const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
      try {
        const [summaryRes, vipRes, metricsRes, miningRes, miniTasksRes, commissionRes] = await Promise.all([
          fetch(`${API_URL}/api/user/summary/${user.id}`, { headers: authHeaders }),
          fetch(`${API_URL}/api/vip/user/${user.id}`, { headers: authHeaders }),
          fetch(`${API_URL}/api/profile/metrics/${user.id}`, { headers: authHeaders }),
          fetch(`${API_URL}/api/mining/tasks/${user.id}`, { headers: authHeaders }),
          fetch(`${API_URL}/api/mini-tasks/${user.id}`, { headers: authHeaders }),
          fetch(`${API_URL}/api/referral/commission-levels`),
        ])

        if (summaryRes.ok) {
          const summaryData = (await summaryRes.json()) as SummaryResponse
          setBalance(Number(summaryData.balance ?? 0))
          setTotalDeposits(Number(summaryData.totalDeposits ?? 0))
          setMonthlySalaryContract(String(summaryData.monthlySalaryContract ?? '').trim())
          setMancecoinBalance(Number(summaryData.mancecoinBalance ?? 0))
        }

        if (vipRes.ok) {
          const vipData = (await vipRes.json()) as VipResponse
          if (vipData?.ok && vipData?.hasVip && vipData.vip) {
            const lvlName = String(vipData.vip.levelName ?? '').trim()
            setVipLevelName(lvlName)
            setVipImageUrl(String(vipData.vip.avatarUrl ?? ''))
            if (typeof vipData.balance === 'number') setBalance(Number(vipData.balance))
          } else {
            setVipLevelName('')
            setVipImageUrl('')
          }
        }

        if (miniTasksRes.ok) await miniTasksRes.json().catch(() => null)

        if (metricsRes.ok) {
          const metricsData = (await metricsRes.json()) as ProfileMetricsResponse
          const metrics = metricsData?.metrics
          if (metrics) {
            setWithdrawableBalance(Number(metrics.withdrawableBalance ?? 0))
            setTodayIncome(Number(metrics.todayIncome ?? 0))
            setTeamTotal(Number(metrics.teamTotal ?? 0))
            setTotalIncome(Number(metrics.totalIncome ?? 0))
            setTotalWithdrawals(Number(metrics.totalWithdrawals ?? 0))
            setCycleIncome(Number(metrics.cycleIncome ?? 0))
            setTeamIncome(Number(metrics.teamIncome ?? 0))
            setOtherIncome(Number(metrics.otherIncome ?? 0))
            setActiveProductName(String(metrics.activeCyclePlan?.productName ?? '').trim())
          }
        }

        if (miningRes.ok) await miningRes.json().catch(() => null)

        if (commissionRes.ok) {
          const cd = await commissionRes.json().catch(() => null) as { ok?: boolean; levels?: Array<{ level?: number; commissionPercent?: number }> } | null
          if (cd?.ok && Array.isArray(cd.levels)) {
            setCommissionLevels(
              cd.levels
                .map((l) => ({ level: Number(l.level ?? 0), commissionPercent: Number(l.commissionPercent ?? 0) }))
                .filter((l) => l.level >= 1 && l.level <= 3)
                .sort((a, b) => a.level - b.level)
            )
          }
        }
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [navigate, user?.id])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    navigate('/')
  }

  const avatarSrc = vipImageUrl
    ? (vipImageUrl.startsWith('http') ? vipImageUrl : `${API_URL}${vipImageUrl}`)
    : 'https://manceraparfums.com/esp/img/hp_custom_block/block_image_1.jpg'

  return (
    <main className="dash-app profile-page">
      <section className="dash-main">
        <AppSidebar />

        <div className="dash-content">
          {loading ? (
            <div className="prof-loading">Carregando perfil...</div>
          ) : (
            <div className="prof-body">

              {/* ── Title ── */}
              <div className="prof-title-bar">
                <h1 className="prof-title">Perfil</h1>
              </div>

              {/* ── User info ── */}
              <div className="prof-section">
                <div className="prof-user-row">
                  <div className="prof-avatar-wrap">
                    <div className="prof-avatar-circle">
                      <img src={avatarSrc} alt="Avatar" className="prof-avatar-img" />
                    </div>
                    <div className="prof-vip-badge">{activeProductName || vipLevelName || 'VIP1'}</div>
                  </div>
                  <div className="prof-user-info">
                    <div className="prof-user-acc">
                      <span className="prof-acc-label">ACC:</span>
                      <span className="prof-acc-value">{maskPhone(user?.phone ?? user?.name ?? '')}</span>
                    </div>
                    <div className="prof-user-id">ID: {user?.id}</div>
                  </div>
                </div>
              </div>

              {/* ── Meus Produtos ── */}
              <div className="prof-section">
                <div className="prof-white-card prof-products-row">
                  <span className="prof-card-title">Meus Produtos</span>
                  <button type="button" className="prof-receber-btn" onClick={() => navigate('/fund-details')}>
                    <img src="/moeda.png" alt="moeda" className="prof-receber-coin" />
                    <span>Receber Renda</span>
                  </button>
                </div>
              </div>

              {/* ── Wallet card ── */}
              <div className="prof-section">
                <div className="prof-white-card">
                  <div className="prof-wallet-top">
                    <div className="prof-wallet-col">
                      <span className="prof-wallet-val">{formatNum(balance)}</span>
                      <span className="prof-wallet-lbl">Carteira Normal</span>
                    </div>
                    <div className="prof-wallet-col prof-wallet-col--border">
                      <span className="prof-wallet-val">{formatNum(withdrawableBalance)}</span>
                      <span className="prof-wallet-lbl">Carteira da Equipe</span>
                    </div>
                  </div>

                  <div className="prof-actions-row">
                    <button type="button" className="prof-action-btn" onClick={() => navigate('/cashin')}>Depositar</button>
                    <button type="button" className="prof-action-btn" onClick={() => navigate('/saque/')}>Sacar</button>
                  </div>

                  <div className="prof-stats-grid">
                    <div className="prof-stat">
                      <span className="prof-stat-lbl">Renda Total</span>
                      <span className="prof-stat-val">{formatNum(totalIncome)}</span>
                    </div>
                    <div className="prof-stat prof-stat--right">
                      <span className="prof-stat-lbl">Retirada Total</span>
                      <span className="prof-stat-val">{formatNum(totalWithdrawals)}</span>
                    </div>
                    <div className="prof-stat">
                      <span className="prof-stat-lbl">Renda do Produto</span>
                      <span className="prof-stat-val">{formatNum(cycleIncome)}</span>
                    </div>
                    <div className="prof-stat prof-stat--right">
                      <span className="prof-stat-lbl">Renda da Equipe</span>
                      <span className="prof-stat-val">{formatNum(teamIncome)}</span>
                    </div>
                    <div className="prof-stat">
                      <span className="prof-stat-lbl">Outras Rendas</span>
                      <span className="prof-stat-val">{formatNum(otherIncome)}</span>
                    </div>
                    <div className="prof-stat prof-stat--right">
                      <span className="prof-stat-lbl">MANCOIN</span>
                      <span className="prof-stat-val">{formatNum(mancecoinBalance)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Minha equipe ── */}
              <div className="prof-section">
                <div className="prof-white-card">
                  <div className="prof-team-header">
                    <span className="prof-card-title">Minha equipe</span>
                    <svg className="prof-team-icon" viewBox="0 0 24 24" fill="none">
                      <path d="M10 22H14C19 22 21 20 21 15V9C21 4 19 2 14 2H10C5 2 3 4 3 9V15C3 20 5 22 10 22Z" stroke="#8C91A2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16.5 7.58V8.58C16.5 9.4 15.83 10.08 15 10.08H9C8.18 10.08 7.5 9.41 7.5 8.58V7.58C7.5 6.76 8.17 6.08 9 6.08H15C15.83 6.08 16.5 6.75 16.5 7.58Z" stroke="#8C91A2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8.14 14H8.15M12 14H12.01M15.85 14H15.87M8.14 17.5H8.15M12 17.5H12.01M15.85 17.5H15.87" stroke="#8C91A2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>

                  <div className="prof-team-levels">
                    {(['LV1', 'LV2', 'LV3'] as const).map((lv) => (
                      <div key={lv} className="prof-team-level">
                        <span className="prof-team-lv-label">{lv}</span>
                        <span className="prof-team-lv-count">0</span>
                      </div>
                    ))}
                  </div>

                  <p className="prof-team-rules">
                    {commissionLevels.length > 0
                      ? `Regras: ${commissionLevels.map((l) => `Membros Nível ${l.level} - comissão de ${l.commissionPercent}%`).join('; ')}.`
                      : 'Regras: Membros Nível 1 - comissão de 10%; Membros Nível 2 - comissão de 5%; Membros Nível 3 - comissão de 2%.'}
                  </p>

                  <button type="button" className="prof-team-details-btn" onClick={() => navigate('/position')}>
                    <span>Detalhes</span>
                    <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* ── Menu grid ── */}
              <div className="prof-section">
                <div className="prof-white-card">
                  <div className="prof-menu-new">

                    <button type="button" className="prof-menu-new-item" onClick={() => navigate('/redeem-code')}>
                      <div className="prof-menu-new-icon">
                        <svg viewBox="0 0 20 20" fill="none" width="20" height="20">
                          <path d="M14.1625 3.3335H5.82916C2.6375 3.3335 1.74583 4.10016 1.67083 7.0835C3.27916 7.0835 4.57916 8.39183 4.57916 10.0002C4.57916 11.6085 3.27916 12.9085 1.67083 12.9168C1.74583 15.9002 2.6375 16.6668 5.82916 16.6668H14.1625C17.4958 16.6668 18.3292 15.8335 18.3292 12.5002V7.50016C18.3292 4.16683 17.4958 3.3335 14.1625 3.3335Z" stroke="#292D32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M7.4944 3.3335V6.25016M7.4944 13.75V16.6667" stroke="#292D32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12.5208 7.7748L13.0375 8.81647C13.0875 8.91647 13.1875 8.99147 13.2958 9.00814L14.4458 9.1748C14.7292 9.21647 14.8458 9.56647 14.6375 9.76647L13.8042 10.5748C13.7208 10.6498 13.6875 10.7665 13.7042 10.8831L13.9042 12.0248C13.9542 12.3081 13.6542 12.5248 13.4042 12.3915L12.3792 11.8498C12.2792 11.7998 12.1542 11.7998 12.0542 11.8498L11.0292 12.3915C10.7708 12.5248 10.4792 12.3081 10.5292 12.0248L10.7292 10.8831C10.7458 10.7665 10.7125 10.6581 10.6292 10.5748L9.80417 9.76647C9.59583 9.56647 9.7125 9.21647 9.99583 9.1748L11.1458 9.00814C11.2625 8.99147 11.3542 8.9248 11.4042 8.81647L11.9125 7.7748C12.0292 7.51647 12.3958 7.51647 12.5208 7.7748Z" stroke="#292D32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <span>Código de Resgate</span>
                    </button>

                    <button type="button" className="prof-menu-new-item" onClick={() => navigate('/bank-cards')}>
                      <div className="prof-menu-new-icon">
                        <svg viewBox="0 0 20 20" fill="none" width="20" height="20">
                          <path d="M1.66667 7.0874H18.3333" stroke="#292D32" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M5 13.7539H6.66667M8.75 13.7539H12.0833" stroke="#292D32" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M5.36667 2.9209H14.625C17.5917 2.9209 18.3333 3.65423 18.3333 6.57923V13.4209C18.3333 16.3459 17.5917 17.0792 14.6333 17.0792H5.36667C2.40834 17.0876 1.66667 16.3542 1.66667 13.4292V6.57923C1.66667 3.65423 2.40834 2.9209 5.36667 2.9209Z" stroke="#292D32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <span>Conta Bancária</span>
                    </button>

                    <button type="button" className="prof-menu-new-item" onClick={() => navigate('/fund-details')}>
                      <div className="prof-menu-new-icon">
                        <svg viewBox="0 0 20 20" fill="none" width="20" height="20">
                          <path d="M7.22656 11.9417C7.22656 13.0167 8.05156 13.8834 9.07656 13.8834H11.1682C12.0599 13.8834 12.7849 13.125 12.7849 12.1917C12.7849 11.175 12.3432 10.8167 11.6849 10.5834L8.32656 9.4167C7.66823 9.18337 7.22656 8.82503 7.22656 7.80837C7.22656 6.87503 7.95156 6.1167 8.84323 6.1167H10.9349C11.9599 6.1167 12.7849 6.98337 12.7849 8.05837" stroke="#292D32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M10 5V15" stroke="#292D32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M9.99999 18.3332C14.6024 18.3332 18.3333 14.6022 18.3333 9.99984C18.3333 5.39746 14.6024 1.6665 9.99999 1.6665C5.39762 1.6665 1.66666 5.39746 1.66666 9.99984C1.66666 14.6022 5.39762 18.3332 9.99999 18.3332Z" stroke="#292D32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <span>Detalhes de Fundos</span>
                    </button>

                    <button type="button" className="prof-menu-new-item" onClick={() => navigate('/change-password')}>
                      <div className="prof-menu-new-icon">
                        <svg viewBox="0 0 20 20" fill="none" width="20" height="20">
                          <path d="M5 8.33317V6.6665C5 3.90817 5.83333 1.6665 10 1.6665C14.1667 1.6665 15 3.90817 15 6.6665V8.33317" stroke="#161616" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M14.1667 18.3335H5.83333C2.5 18.3335 1.66666 17.5002 1.66666 14.1668V12.5002C1.66666 9.16683 2.5 8.3335 5.83333 8.3335H14.1667C17.5 8.3335 18.3333 9.16683 18.3333 12.5002V14.1668C18.3333 17.5002 17.5 18.3335 14.1667 18.3335Z" stroke="#161616" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M13.3304 13.3332H13.3379M9.99623 13.3332H10.0037M6.66209 13.3332H6.66957" stroke="#161616" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <span>Senha</span>
                    </button>

                    <button type="button" className="prof-menu-new-item" onClick={() => navigate('/withdraw-password')}>
                      <div className="prof-menu-new-icon">
                        <svg viewBox="0 0 20 20" fill="none" width="20" height="20">
                          <path d="M5 8.33317V6.6665C5 3.90817 5.83333 1.6665 10 1.6665C14.1667 1.6665 15 3.90817 15 6.6665V8.33317" stroke="#161616" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M14.1667 18.3335H5.83333C2.5 18.3335 1.66666 17.5002 1.66666 14.1668V12.5002C1.66666 9.16683 2.5 8.3335 5.83333 8.3335H14.1667C17.5 8.3335 18.3333 9.16683 18.3333 12.5002V14.1668C18.3333 17.5002 17.5 18.3335 14.1667 18.3335Z" stroke="#161616" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M13.3304 13.3332H13.3379M9.99623 13.3332H10.0037M6.66209 13.3332H6.66957" stroke="#161616" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <span>Configurar senha de saque</span>
                    </button>

                    <button type="button" className="prof-menu-new-item" onClick={() => navigate('/statement')}>
                      <div className="prof-menu-new-icon">
                        <svg viewBox="0 0 20 20" fill="none" width="20" height="20">
                          <path d="M16.6667 6.87484V14.9998C16.6667 17.4998 15.175 18.3332 13.3333 18.3332H6.66666C4.82499 18.3332 3.33333 17.4998 3.33333 14.9998V6.87484C3.33333 4.1665 4.82499 3.5415 6.66666 3.5415C6.66666 4.05817 6.87497 4.52483 7.21664 4.8665C7.55831 5.20817 8.02499 5.4165 8.54166 5.4165H11.4583C12.4917 5.4165 13.3333 4.57484 13.3333 3.5415C15.175 3.5415 16.6667 4.1665 16.6667 6.87484Z" stroke="#292D32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M13.3333 3.5415C13.3333 4.57484 12.4917 5.4165 11.4583 5.4165H8.54167C8.02501 5.4165 7.55832 5.20817 7.21665 4.8665C6.87498 4.52483 6.66667 4.05817 6.66667 3.5415C6.66667 2.50817 7.50834 1.6665 8.54167 1.6665H11.4583C11.975 1.6665 12.4417 1.87484 12.7834 2.21651C13.125 2.55817 13.3333 3.02484 13.3333 3.5415Z" stroke="#292D32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M6.66667 10.8335H10M6.66667 14.1665H13.3333" stroke="#292D32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <span>Sair do Artigo</span>
                    </button>

                    <button type="button" className="prof-menu-new-item" onClick={handleLogout}>
                      <div className="prof-menu-new-icon">
                        <svg viewBox="0 0 20 20" fill="none" width="20" height="20">
                          <path d="M6.04168 3.3335C5.76693 3.49038 5.50259 3.66309 5.25001 3.85038C4.81772 4.17087 4.41976 4.53408 4.06251 4.93358C2.83075 6.31112 2.08334 8.12062 2.08334 10.1025C2.08334 14.4182 5.62776 17.9168 10 17.9168C14.3723 17.9168 17.9167 14.4182 17.9167 10.1025C17.9167 8.12062 17.1693 6.31112 15.9375 4.93358C15.5803 4.53408 15.1823 4.17087 14.75 3.85038C14.4974 3.66309 14.2331 3.49038 13.9583 3.3335" stroke="#161616" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M10 1.6665V9.99984" stroke="#161616" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <span>Sair</span>
                    </button>

                    <button type="button" className="prof-menu-new-item" onClick={() => navigate('/shipping-address')}>
                      <div className="prof-menu-new-icon">
                        <svg viewBox="0 0 20 20" fill="none" width="20" height="20">
                          <path d="M1.66667 7.0874H18.3333" stroke="#292D32" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M5 13.7539H6.66667M8.75 13.7539H12.0833" stroke="#292D32" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M5.36667 2.9209H14.625C17.5917 2.9209 18.3333 3.65423 18.3333 6.57923V13.4209C18.3333 16.3459 17.5917 17.0792 14.6333 17.0792H5.36667C2.40834 17.0876 1.66667 16.3542 1.66667 13.4292V6.57923C1.66667 3.65423 2.40834 2.9209 5.36667 2.9209Z" stroke="#292D32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <span>Endereço de entrega</span>
                    </button>

                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </section>

      {showRedeemSuccessModal && redeemSuccessData ? (
        <div className="redeem-modal-overlay" role="dialog" aria-modal="true">
          <div className="redeem-modal-card">
            <div className="redeem-modal-badge">🎉 Sucesso</div>
            <h2>Código resgatado!</h2>
            <p className="redeem-modal-message">{redeemSuccessData.message}</p>
            <div className="redeem-modal-highlight">
              <span>Valor resgatado</span>
              <strong>R$ {formatNum(redeemSuccessData.rewardValue)}</strong>
            </div>
            <p className="redeem-modal-code">Código: <b>{redeemSuccessData.code}</b></p>
            <button type="button" className="redeem-modal-btn" onClick={() => setShowRedeemSuccessModal(false)}>
              Continuar
            </button>
          </div>
        </div>
      ) : null}
    </main>
  )
}
