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
  claimedToday?: boolean
  rewards?: number[]
  history?: Array<{
    day?: number
    rewardAmount?: number
    checkinDate?: string
  }>
  error?: string
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Checkin() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [canClaim, setCanClaim] = useState(false)
  const [currentDay, setCurrentDay] = useState(1)
  const [rewards, setRewards] = useState<number[]>([2, 2, 3, 3, 4, 4, 5, 5, 6, 10])
  const [historyDays, setHistoryDays] = useState<number[]>([])
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const progressPercent = Math.min(100, Math.max(0, (historyDays.length / 10) * 100))

  const user = useMemo(() => {
    const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')
    if (!raw) return null
    try {
      return JSON.parse(raw) as StoredUser
    } catch {
      return null
    }
  }, [])

  const loadStatus = async () => {
    if (!user?.id) return

    try {
      const res = await fetch(`${API_URL}/api/checkin/status/${user.id}`)
      const data = (await res.json()) as CheckinStatusResponse

      if (!res.ok || !data?.ok) {
        setFeedback({ type: 'error', message: data?.error ?? 'Erro ao carregar check-in.' })
        return
      }

      setCanClaim(Boolean(data.canClaim))
      setCurrentDay(Math.min(Math.max(Number(data.currentDay ?? 1), 1), 10))
      if (Array.isArray(data.rewards) && data.rewards.length === 10) {
        setRewards(data.rewards.map((v) => Number(v ?? 0)))
      }

      const days = Array.isArray(data.history)
        ? data.history.map((item) => Number(item.day ?? 0)).filter((d) => d >= 1 && d <= 10)
        : []
      setHistoryDays(days)
    } catch {
      setFeedback({ type: 'error', message: 'Falha de conexão ao carregar check-in.' })
    }
  }

  useEffect(() => {
    if (!user?.id) {
      navigate('/')
      return
    }

    const run = async () => {
      setLoading(true)
      await loadStatus()
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
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId: user.id }),
      })

      const data = await res.json().catch(() => ({})) as {
        ok?: boolean
        error?: string
        message?: string
        claim?: { day?: number; rewardAmount?: number }
      }

      if (!res.ok || !data?.ok) {
        setFeedback({ type: 'error', message: data?.error ?? 'Não foi possível resgatar o check-in.' })
        return
      }

      const reward = Number(data?.claim?.rewardAmount ?? 0)
      setFeedback({
        type: 'success',
        message: data?.message ?? `Check-in resgatado! Você recebeu ${formatBRL(reward)}.`,
      })

      await loadStatus()
    } catch {
      setFeedback({ type: 'error', message: 'Erro de conexão ao resgatar check-in.' })
    } finally {
      setClaiming(false)
    }
  }

  return (
    <main className="ck-page">
      <a href="/support" className="support-float-btn" title="Suporte">
        <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
      </a>
      <header className="ck-topbar">
        <button
          type="button"
          className="ck-topbar-back"
          onClick={() => navigate('/profile')}
          aria-label="Voltar"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6l6 6" />
          </svg>
        </button>
        <span className="ck-topbar-title">Check-in Diário</span>
      </header>

      <div className="ck-scroll-box">
        {loading ? (
          <div className="ck-loading">Carregando seu progresso...</div>
        ) : (
          <>
            {/* Progress */}
            <section className="ck-section">
              <h3 className="ck-section-title">Status do progresso</h3>
              <div className="ck-progress-row">
                <span>Dias concluídos</span>
                <span>{historyDays.length}/10</span>
              </div>
              <div className="ck-progress-track">
                <div className="ck-progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
              <span className="ck-progress-percent">{Math.round(progressPercent)}% completo</span>

              <div className="ck-status-row">
                <span className="ck-pill">Dia atual: {currentDay}/10</span>
                <span className={`ck-pill ${canClaim ? 'ck-pill--ok' : 'ck-pill--warn'}`}>
                  {canClaim ? 'Disponível para resgatar' : 'Resgate de hoje concluído'}
                </span>
              </div>

              <button
                type="button"
                className="ck-claim-btn"
                onClick={handleClaim}
                disabled={!canClaim || claiming}
              >
                {claiming
                  ? 'Resgatando...'
                  : canClaim
                    ? `Resgatar ${formatBRL(Number(rewards[currentDay - 1] ?? 0))}`
                    : 'Resgate de hoje concluído'}
              </button>
            </section>

            {/* Days grid */}
            <section className="ck-section">
              <h3 className="ck-section-title">Recompensas dos 10 dias</h3>
              <div className="ck-grid">
                {Array.from({ length: 10 }).map((_, index) => {
                  const day = index + 1
                  const isDone = historyDays.includes(day)
                  const isCurrent = currentDay === day && !isDone
                  return (
                    <article
                      key={day}
                      className={`ck-day ${isDone ? 'ck-day--done' : ''} ${isCurrent ? 'ck-day--current' : ''}`}
                    >
                      <div className="ck-day-head">
                        <span className="ck-day-badge">Dia {day}</span>
                        {isDone ? (
                          <span className="ck-day-status ck-day-status--done">✓</span>
                        ) : isCurrent ? (
                          <span className="ck-day-status ck-day-status--current">Hoje</span>
                        ) : null}
                      </div>
                      <span className="ck-day-amount">{formatBRL(Number(rewards[index] ?? 0))}</span>
                      <span className="ck-day-hint">
                        {isDone ? 'Resgatado' : isCurrent ? 'Disponível hoje' : 'Aguardando'}
                      </span>
                    </article>
                  )
                })}
              </div>
            </section>

          </>
        )}
      </div>

      {feedback ? (
        <div
          className="ck-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setFeedback(null)}
        >
          <div className="ck-modal" onClick={(e) => e.stopPropagation()}>
            <div className={`ck-modal-icon ck-modal-icon--${feedback.type}`}>
              {feedback.type === 'success' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
            </div>
            <p className="ck-modal-message">{feedback.message}</p>
            <button
              type="button"
              className="ck-modal-button"
              onClick={() => setFeedback(null)}
            >
              OK
            </button>
          </div>
        </div>
      ) : null}
    </main>
  )
}
