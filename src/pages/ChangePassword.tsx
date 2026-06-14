import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './ChangePassword.css'
import { API_URL } from '../utils/apiUrl'

type StoredUser = {
  id: number
  name: string
  phone: string
}


export default function ChangePassword() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
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
    <main className="cp-page cp-forgot-style">
      <div className="cp-content">
        <header className="cp-header">
          <button
            type="button"
            className="cp-back"
            onClick={() => navigate('/profile')}
            aria-label="Voltar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6l-6 6l6 6" />
            </svg>
          </button>
        </header>

        <h1 className="cp-title">Esqueci a senha</h1>

        <div className="cp-form-stack">
          <div className="cp-input-card cp-phone-card">
            <div className="cp-phone-prefix">
              <span className="cp-flag">🇧🇷</span>
              <span>+55</span>
            </div>
            <input
              type="tel"
              className="cp-input"
              placeholder="Por favor, insira o número de telefone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <input
            type="password"
            className="cp-input-card cp-only-input"
            placeholder="Nova Senha"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />

          <input
            type="password"
            className="cp-input-card cp-only-input"
            placeholder="Confirmar senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />

          <input
            type="password"
            className="cp-hidden-current-password"
            placeholder="Senha atual (obrigatório)"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
      </div>

      <div className="cp-bottom-submit-wrap">
        <button
          type="button"
          className="cp-bottom-submit"
          onClick={saveNewPassword}
          disabled={loading}
        >
          {loading ? 'Enviando...' : 'Confirmar'}
        </button>
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
