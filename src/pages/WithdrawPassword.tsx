import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './WithdrawPassword.css'
import { API_URL } from '../utils/apiUrl'

type StoredUser = {
  id: number
  name: string
  phone: string
}


export default function WithdrawPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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

  const saveWithdrawPassword = async () => {
    if (!user?.id) {
      setFeedback({ type: 'error', message: 'Usuário não autenticado.' })
      return
    }

    if (!password || password.length < 6) {
      setFeedback({ type: 'error', message: 'A senha de saque deve ter no mínimo 6 caracteres.' })
      return
    }

    if (password !== confirmPassword) {
      setFeedback({ type: 'error', message: 'As senhas não conferem.' })
      return
    }

    setLoading(true)
    setFeedback(null)

    const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''
    try {
      const res = await fetch(`${API_URL}/api/user/withdraw-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ userId: user.id, password }),
      })

      const data = await res.json() as { ok?: boolean; error?: string; message?: string }

      if (!res.ok || !data?.ok) {
        setFeedback({ type: 'error', message: data?.error ?? 'Não foi possível salvar a senha.' })
        return
      }

      setPassword('')
      setConfirmPassword('')
      setFeedback({ type: 'success', message: data?.message ?? 'Senha de saque salva com sucesso.' })
    } catch {
      setFeedback({ type: 'error', message: 'Erro de conexão ao salvar senha.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="wp-page">
      <header className="wp-topbar">
        <button
          type="button"
          className="wp-topbar-back"
          onClick={() => navigate('/profile')}
          aria-label="Voltar"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6l6 6" />
          </svg>
        </button>
        <span className="wp-topbar-title">Senha de retirada</span>
      </header>

      <div className="wp-scroll-box">
        <div className="wp-cell">
          <div className="wp-cell-title">
            <span>Configurar senha de retirada</span>
          </div>
          <div className="wp-cell-value">
            <input
              type="password"
              className="wp-cell-input"
              placeholder="Digite a nova senha de retirada"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
        </div>

        <div className="wp-cell">
          <div className="wp-cell-title">
            <span>Confirmar senha</span>
          </div>
          <div className="wp-cell-value">
            <input
              type="password"
              className="wp-cell-input"
              placeholder="Confirme a nova senha de retirada"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
        </div>

        <div className="wp-submit-wrap">
          <button
            type="button"
            className="wp-submit"
            onClick={saveWithdrawPassword}
            disabled={loading}
          >
            <span>{loading ? 'Enviando...' : 'Enviar'}</span>
          </button>
        </div>
      </div>

      {feedback ? (
        <div
          className="wp-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setFeedback(null)}
        >
          <div className="wp-modal" onClick={(e) => e.stopPropagation()}>
            <div className={`wp-modal-icon wp-modal-icon--${feedback.type}`}>
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
            <p className="wp-modal-message">{feedback.message}</p>
            <button
              type="button"
              className="wp-modal-button"
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
