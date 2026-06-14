import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import './Dashboard.css'
import './TaskBonus.css'
import { API_URL } from '../utils/apiUrl'


type BonusTier = {
  invites: number
  reward: number
}

const BONUS_TIERS: BonusTier[] = [
  { invites: 5, reward: 10 },
  { invites: 10, reward: 25 },
  { invites: 20, reward: 60 },
  { invites: 35, reward: 120 },
  { invites: 50, reward: 200 },
]

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function TaskBonus() {
  const navigate = useNavigate()

  const [user, setUser] = useState<{ id: number } | null>(null)
  const [validInvites, setValidInvites] = useState(0)
  const [redeemedTiers, setRedeemedTiers] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [redeemingTier, setRedeemingTier] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token') ?? sessionStorage.getItem('token')
    const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')
    if (!token || !raw) {
      navigate('/')
      return
    }
    try {
      setUser(JSON.parse(raw) as { id: number })
    } catch {
      navigate('/')
    }
  }, [navigate])

  useEffect(() => {
    if (!user?.id) return

    const loadTaskBonus = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem('token') ?? sessionStorage.getItem('token')
        const res = await fetch(`${API_URL}/api/user/task-bonus/${user.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const data = await res.json().catch(() => ({})) as {
          ok?: boolean
          validInvites?: number
          redeemedTiers?: number[]
        }
        if (data?.ok) {
          setValidInvites(Number(data.validInvites ?? 0))
          setRedeemedTiers(new Set(data.redeemedTiers ?? []))
        }
      } catch { /* silencioso */ } finally {
        setLoading(false)
      }
    }

    loadTaskBonus()
  }, [user?.id])

  const tiersWithStatus = useMemo(() => {
    return BONUS_TIERS.map((tier, index) => {
      const unlocked = validInvites >= tier.invites
      const alreadyRedeemed = redeemedTiers.has(index)
      const progress = Math.max(0, Math.min(100, (validInvites / tier.invites) * 100))
      return { ...tier, index, unlocked, progress, alreadyRedeemed }
    })
  }, [validInvites, redeemedTiers])

  const totalUnlocked = tiersWithStatus
    .filter((tier) => tier.unlocked && tier.alreadyRedeemed)
    .reduce((sum, tier) => sum + tier.reward, 0)

  const handleRedeem = async (tierIndex: number) => {
    if (!user?.id) return
    setRedeemingTier(tierIndex)
    setFeedback(null)
    try {
      const token = localStorage.getItem('token') ?? sessionStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/user/task-bonus/${tierIndex}/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      const data = await res.json().catch(() => ({})) as {
        ok?: boolean
        error?: string
        message?: string
        rewardAmount?: number
      }
      if (!res.ok || !data?.ok) {
        setFeedback({ type: 'error', message: data?.error ?? 'Não foi possível resgatar.' })
        return
      }
      setRedeemedTiers((prev) => new Set([...prev, tierIndex]))
      setFeedback({ type: 'success', message: data?.message ?? 'Bônus resgatado com sucesso!' })
    } catch {
      setFeedback({ type: 'error', message: 'Erro de conexão.' })
    } finally {
      setRedeemingTier(null)
    }
  }

  if (!user) return null

  return (
    <main className="taskbonus-page">
      <section className="dashboard-shell">
        <AppSidebar />

        <div className="dashboard-content">
          <div className="taskbonus-wrap">
            <header className="taskbonus-head">
              <button type="button" className="taskbonus-back taskbonus-back-top" onClick={() => navigate('/dashboard')}>
                ← Voltar
              </button>
              <img
                src="/moeda.png"
                alt="Moeda"
                className="taskbonus-top-image"
              />
              <h1>Bônus de Tarefa</h1>
              <p>
                Convide usuários nível 1 que realizem depósito pelo seu link e desbloqueie bônus progressivos.
              </p>
            </header>

            <section className="taskbonus-summary">
              <div className="taskbonus-kpi">
                <span>Convites válidos (nível 1)</span>
                <strong>{loading ? '...' : validInvites}</strong>
              </div>
              <div className="taskbonus-kpi">
                <span>Bônus já resgatado</span>
                <strong>{formatBRL(totalUnlocked)}</strong>
              </div>
            </section>

            {feedback && (
              <div className={`taskbonus-feedback ${feedback.type}`}>
                {feedback.type === 'success' ? '✅ ' : '❌ '}
                {feedback.message}
              </div>
            )}

            <section className="taskbonus-rules">
              <h2>Como funciona</h2>
              <ul>
                <li>Conta apenas convidado de nível 1 que depositar pelo seu link.</li>
                <li>Cada meta pode ser resgatada 1 vez.</li>
                <li>Bônus é creditado no saldo ao resgatar.</li>
              </ul>
            </section>

            <section className="taskbonus-list">
              {tiersWithStatus.map((tier) => {
                const isRedeemed = tier.alreadyRedeemed
                const canRedeem = tier.unlocked && !isRedeemed
                const isRedeeming = redeemingTier === tier.index

                return (
                  <article key={tier.invites} className={`taskbonus-card ${canRedeem ? 'is-unlocked' : ''} ${isRedeemed ? 'is-redeemed' : ''}`}>
                    <div className="taskbonus-card-top">
                      <div className="taskbonus-card-title-wrap">
                        <img src="/mancoin.png" alt="Mancoin" className="taskbonus-card-mini-image" />
                        <h3>{tier.invites} convites válidos</h3>
                      </div>
                      <span className="taskbonus-reward">{formatBRL(tier.reward)}</span>
                    </div>

                    <div className="taskbonus-progress">
                      <div className="taskbonus-progress-bar" style={{ width: `${tier.progress}%` }} />
                    </div>

                    <div className="taskbonus-card-bottom">
                      <span>
                        {isRedeemed ? 'Bônus resgatado' : canRedeem ? 'Meta concluída' : `Progresso: ${Math.floor(tier.progress)}%`}
                      </span>
                      <button
                        type="button"
                        disabled={!canRedeem || isRedeeming}
                        onClick={() => handleRedeem(tier.index)}
                      >
                        {isRedeeming ? 'Resgatando...' : isRedeemed ? 'Resgatado' : canRedeem ? 'Resgatar bônus' : 'Bloqueado'}
                      </button>
                    </div>
                  </article>
                )
              })}
            </section>
          </div>
        </div>
      </section>
    </main>
  )
}
