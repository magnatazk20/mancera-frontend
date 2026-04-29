import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './ChangePassword.css'

type StoredUser = {
  id: number
  name: string
  phone: string
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

export default function ChangePassword() {
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
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

  const saveNewPassword = async () => {
    if (!user?.id) {
      setFeedback({ type: 'error', message: 'Usuário não autenticado.' })
      return
    }

    if (!currentPassword) {
      setFeedback({ type: 'error', message: 'Informe sua senha atual.' })
      return
    }

    if (!newPassword || newPassword.length < 6) {
      setFeedback({ type: 'error', message: 'A nova senha deve ter no mínimo 6 caracteres.' })
      return
    }

    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', message: 'As senhas não conferem.' })
      return
    }

    setLoading(true)

    const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''
    try {
      const res = await fetch(`${API_URL}/api/user/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          userId: user.id,
          currentPassword,
          newPassword,
        }),
      })

      const data = await res.json() as { ok?: boolean; error?: string; message?: string }

      if (!res.ok || !data?.ok) {
        setFeedback({ type: 'error', message: data?.error ?? 'Não foi possível alterar a senha.' })
        return
      }

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setFeedback({ type: 'success', message: data?.message ?? 'Senha alterada com sucesso.' })
    } catch {
      setFeedback({ type: 'error', message: 'Erro de conexão ao alterar senha.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="cp-page">
      <header className="cp-topbar">
        <button
          type="button"
          className="cp-topbar-back"
          onClick={() => navigate('/profile')}
          aria-label="Voltar"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6l6 6" />
          </svg>
        </button>
        <span className="cp-topbar-title">Alterar senha</span>
      </header>

      <div className="cp-scroll-box">
        <div className="cp-cell">
          <div className="cp-cell-title">
            <span>Senha atual</span>
          </div>
          <div className="cp-cell-value">
            <input
              type="password"
              className="cp-cell-input"
              placeholder="Digite sua senha atual"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
        </div>

        <div className="cp-cell">
          <div className="cp-cell-title">
            <span>Nova senha</span>
          </div>
          <div className="cp-cell-value">
            <input
              type="password"
              className="cp-cell-input"
              placeholder="Mínimo de 6 caracteres"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
        </div>

        <div className="cp-cell">
          <div className="cp-cell-title">
            <span>Confirmar senha</span>
          </div>
          <div className="cp-cell-value">
            <input
              type="password"
              className="cp-cell-input"
              placeholder="Repita a nova senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
        </div>

        <div className="cp-submit-wrap">
          <button
            type="button"
            className="cp-submit"
            onClick={saveNewPassword}
            disabled={loading}
          >
            <span>{loading ? 'Enviando...' : 'Enviar'}</span>
          </button>
        </div>
      </div>

      {feedback ? (
        <div
          className="cp-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setFeedback(null)}
        >
          <div className="cp-modal" onClick={(e) => e.stopPropagation()}>
            <div className={`cp-modal-icon cp-modal-icon--${feedback.type}`}>
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
            <p className="cp-modal-message">{feedback.message}</p>
            <button
              type="button"
              className="cp-modal-button"
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
