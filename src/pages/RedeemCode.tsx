import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './RedeemCode.css'

type StoredUser = {
  id: number
  name: string
  phone: string
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function RedeemCode() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const user = useMemo(() => {
    const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')
    if (!raw) return null
    try {
      return JSON.parse(raw) as StoredUser
    } catch {
      return null
    }
  }, [])

  const handleRedeem = async () => {
    if (!user?.id) {
      setFeedback({ type: 'error', message: 'Usuário não autenticado.' })
      return
    }

    const normalized = code.trim().toUpperCase()
    if (!normalized) {
      setFeedback({ type: 'error', message: 'Informe o código.' })
      return
    }

    setLoading(true)
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
        ok?: boolean
        error?: string
        message?: string
        rewardType?: string
        rewardValue?: number
      }

      if (!res.ok || !data?.ok) {
        setFeedback({ type: 'error', message: data?.error ?? 'Não foi possível resgatar o código.' })
        return
      }

      const reward = Number(data?.rewardValue ?? 0)
      const successMsg = data?.message
        ?? (reward > 0
          ? `Código resgatado! Você recebeu ${formatBRL(reward)}.`
          : 'Código resgatado com sucesso.')

      setFeedback({ type: 'success', message: successMsg })
      setCode('')
    } catch {
      setFeedback({ type: 'error', message: 'Erro de conexão ao resgatar código.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="rc-page">
      <header className="rc-topbar">
        <button
          type="button"
          className="rc-topbar-back"
          onClick={() => navigate(-1)}
          aria-label="Voltar"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6l6 6" />
          </svg>
        </button>
        <span className="rc-topbar-title">Resgatar código</span>
      </header>

      <div className="rc-scroll-box">
        <section className="rc-hero">
          <div className="rc-hero-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 12v9H4v-9" />
              <rect x="2" y="7" width="20" height="5" rx="1.5" />
              <path d="M12 22V7" />
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
            </svg>
          </div>
          <h2 className="rc-hero-title">Resgate seu código</h2>
          <p className="rc-hero-text">
            Tem um código promocional? Insira abaixo para receber sua recompensa.
          </p>
        </section>

        <div className="rc-cell">
          <div className="rc-cell-title">
            <span>Código</span>
          </div>
          <div className="rc-cell-value">
            <input
              type="text"
              className="rc-cell-input"
              placeholder="Digite seu código"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              autoComplete="off"
              maxLength={32}
            />
          </div>
        </div>

        <div className="rc-submit-wrap">
          <button
            type="button"
            className="rc-submit"
            onClick={handleRedeem}
            disabled={loading}
          >
            <span>{loading ? 'Resgatando...' : 'Resgatar'}</span>
          </button>
        </div>

        <section className="rc-info-section">
          <h3 className="rc-info-title">Como funciona</h3>
          <ul className="rc-info-list">
            <li>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Códigos são válidos por tempo limitado.</span>
            </li>
            <li>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Cada código pode ser usado apenas uma vez por usuário.</span>
            </li>
            <li>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>O valor é adicionado automaticamente ao seu saldo.</span>
            </li>
          </ul>
        </section>
      </div>

      {feedback ? (
        <div
          className="rc-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setFeedback(null)}
        >
          <div className="rc-modal" onClick={(e) => e.stopPropagation()}>
            <div className={`rc-modal-icon rc-modal-icon--${feedback.type}`}>
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
            <p className="rc-modal-message">{feedback.message}</p>
            <button
              type="button"
              className="rc-modal-button"
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
