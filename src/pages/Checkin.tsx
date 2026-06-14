import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Checkin.css'

type StoredUser = {
  id: number
  name: string
  phone: string
}

type CheckinStatusResponse = {
  ok?: boolean
  canClaim?: boolean
  currentDay?: number
  rewards?: number[]
  history?: Array<{
    day?: number
    rewardAmount?: number
    checkinDate?: string
  }>
  error?: string
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'


export default function Checkin() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [canClaim, setCanClaim] = useState(false)
  const [currentDay, setCurrentDay] = useState(1)
  const [rewards, setRewards] = useState<number[]>([0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2])
  const [historyDays, setHistoryDays] = useState<number[]>([])
  const [historyItems, setHistoryItems] = useState<Array<{ day: number; rewardAmount: number; checkinDate: string }>>([])
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [vipLevel, setVipLevel] = useState(1)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const user = useMemo(() => {
    const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')
    if (!raw) return null
    try { return JSON.parse(raw) as StoredUser } catch { return null }
  }, [])

  const loadStatus = async () => {
    if (!user?.id) return
    try {
      const res = await fetch(`${API_URL}/api/checkin/status/${user.id}`)
      const data = (await res.json()) as CheckinStatusResponse
      if (!res.ok || !data?.ok) return

      setCanClaim(Boolean(data.canClaim))
      setCurrentDay(Math.min(Math.max(Number(data.currentDay ?? 1), 1), 10))
      if (Array.isArray(data.rewards) && data.rewards.length > 0) {
        setRewards(data.rewards.map((v) => Number(v ?? 0)))
      }

      const history = Array.isArray(data.history) ? data.history : []
      const days = history.map((item) => Number(item.day ?? 0)).filter((d) => d >= 1)
      setHistoryDays(days)
      setHistoryItems(history.map((item) => ({
        day: Number(item.day ?? 0),
        rewardAmount: Number(item.rewardAmount ?? 0),
        checkinDate: item.checkinDate ?? '',
      })).filter((item) => item.day >= 1))

      const total = history.reduce((sum, item) => sum + Number(item.rewardAmount ?? 0), 0)
      setTotalEarnings(Number(total.toFixed(2)))
    } catch {/* silencioso */}
  }

  const loadVipLevel = async () => {
    if (!user?.id) return
    try {
      const res = await fetch(`${API_URL}/api/user/summary/${user.id}`)
      const data = await res.json().catch(() => ({})) as { vipLevelId?: number }
      if (res.ok && data?.vipLevelId != null) {
        setVipLevel(Number(data.vipLevelId))
      }
    } catch {/* silencioso */}
  }

  useEffect(() => {
    if (!user?.id) { navigate('/'); return }
    const run = async () => {
      setLoading(true)
      await Promise.all([loadStatus(), loadVipLevel()])
      setLoading(false)
    }
    run()
  }, [navigate, user?.id])

  const handleClaim = async () => {
    if (!user?.id || claiming || !canClaim) return
    setClaiming(true)
    const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''
    try {
      const res = await fetch(`${API_URL}/api/checkin/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ userId: user.id }),
      })
      const data = await res.json().catch(() => ({})) as {
        ok?: boolean; error?: string; message?: string
        claim?: { day?: number; rewardAmount?: number }
      }
      if (!res.ok || !data?.ok) {
        setFeedback({ type: 'error', message: data?.error ?? 'Não foi possível fazer o check-in.' })
        return
      }
      const reward = Number(data?.claim?.rewardAmount ?? 0)
      setFeedback({ type: 'success', message: `Check-in realizado! +${reward.toFixed(2)}` })
      await loadStatus()
    } catch {
      setFeedback({ type: 'error', message: 'Erro de conexão.' })
    } finally {
      setClaiming(false)
    }
  }

  return (
    <main className="ck-page">
      <header className="ck-topbar">
        <button type="button" className="ck-topbar-back" onClick={() => navigate('/profile')} aria-label="Voltar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6l6 6" />
          </svg>
        </button>
        <span className="ck-topbar-title">Check-in Diário</span>
      </header>

      {loading ? (
        <div className="ck-loading">Carregando...</div>
      ) : (
        <div className="ck-scroll-box">

          {/* ── Earnings Section ── */}
          <div className="ck-earnings-section">
            <div className="ck-earnings-text">
              <span className="ck-earnings-label">Meus Ganhos</span>
              <span className="ck-earnings-value">{totalEarnings.toFixed(2)}</span>
            </div>
            <div className="ck-coin-img">
              <img src="/moeda.png" alt="moeda" width="94" height="94" style={{ objectFit: 'contain' }} />
            </div>
          </div>

          {/* ── Sign Card ── */}
          <div className="ck-sign-card">
            {/* Level info */}
            <div className="ck-level-info">
              <svg viewBox="0 0 16 16" fill="none" width="16" height="16" style={{ marginRight: 6 }}>
                <polygon points="8,1 10,6 15,6.5 11.5,10 12.5,15 8,12.5 3.5,15 4.5,10 1,6.5 6,6" fill="#d4af37"/>
              </svg>
              <span className="ck-level-text">LV{vipLevel}</span>
            </div>

            {/* 7-day grid */}
            <div className="ck-days-grid">
              {Array.from({ length: 7 }).map((_, i) => {
                const day = i + 1
                const isDone = historyDays.includes(day)
                const isCurrent = currentDay === day && !isDone
                const isPast = day < currentDay && !isDone

                let stateClass = 'pending'
                if (isDone) stateClass = 'done'
                else if (isCurrent) stateClass = 'current'
                else if (isPast) stateClass = 'past'

                return (
                  <div key={day} className={`ck-day-item ${stateClass}`}>
                    <span className="ck-day-label">Day{day}</span>
                    <div className="ck-day-icon-wrap">
                      {isDone ? (
                        <svg viewBox="0 0 14 14" fill="none" width="16" height="16">
                          <circle cx="7" cy="7" r="6.5" fill="#F9D54A"/>
                          <path d="M4.52 7L6.17 8.65L9.48 5.35" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
                          <circle cx="8" cy="8" r="7.5" fill={isCurrent ? '#d4af37' : isPast ? '#bbb' : '#ccc'}/>
                          <text x="8" y="12" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold" fontFamily="sans-serif">$</text>
                        </svg>
                      )}
                    </div>
                    <span className="ck-day-reward">{(rewards[i] ?? 0).toFixed(2)}</span>
                  </div>
                )
              })}
            </div>

            {/* Claim button */}
            <button
              type="button"
              className={`ck-claim-btn${canClaim ? ' ck-claim-active' : ''}`}
              onClick={handleClaim}
              disabled={!canClaim || claiming}
            >
              {claiming ? 'Processando...' : 'Entrar'}
            </button>
          </div>

          {/* ── History Section ── */}
          <div className="ck-history-section">
            <h3 className="ck-criteria-title">Histórico de Resgates</h3>
            {historyItems.length === 0 ? (
              <p className="ck-history-empty">Nenhum resgate realizado ainda.</p>
            ) : (
              <div className="ck-reward-table">
                <div className="ck-table-header">
                  <span>Dia</span>
                  <span>Data</span>
                  <span>Valor</span>
                </div>
                <div className="ck-table-rows">
                  {[...historyItems].reverse().map((item, idx) => {
                    const date = item.checkinDate ? new Date(item.checkinDate).toLocaleDateString('pt-BR') : '—'
                    return (
                      <div key={idx} className="ck-table-row">
                        <span className="ck-history-day">Dia {item.day}</span>
                        <span className="ck-history-date">{date}</span>
                        <span className="ck-table-reward">+{item.rewardAmount.toFixed(2)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div style={{ height: 30 }} />
        </div>
      )}

      {/* ── Feedback Modal ── */}
      {feedback ? (
        <div className="ck-modal-overlay" role="dialog" aria-modal="true" onClick={() => setFeedback(null)}>
          <div className="ck-modal" onClick={(e) => e.stopPropagation()}>
            <div className={`ck-modal-icon ck-modal-icon--${feedback.type}`}>
              {feedback.type === 'success' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
            </div>
            <p className="ck-modal-message">{feedback.message}</p>
            <button type="button" className="ck-modal-button" onClick={() => setFeedback(null)}>OK</button>
          </div>
        </div>
      ) : null}
    </main>
  )
}
