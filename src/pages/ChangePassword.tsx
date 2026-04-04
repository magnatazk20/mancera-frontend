import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import './Tasks.css'
import './WithdrawPassword.css'

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
    setFeedback(null)

    try {
      const res = await fetch(`${API_URL}/api/user/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    <main className="tasks-page withdraw-password-page">
      <AppSidebar />

      <header className="tasks-header">
        <div>
          <p className="tasks-kicker">Segurança</p>
          <h1>Alterar Senha</h1>
          <span className="tasks-subtitle">Altere a senha da sua conta de usuário</span>
        </div>
        <div className="tasks-header-actions">
          <button className="btn ghost" type="button" onClick={() => navigate('/profile')}>
            Voltar
          </button>
        </div>
      </header>

      <section className="withdraw-password-card">
        <h2>Atualizar Senha de Login</h2>
        <p className="withdraw-password-subtitle">
          Informe sua senha atual e defina uma nova senha para acessar a conta.
        </p>

        <div className="withdraw-password-form">
          <label>
            Senha atual
            <input
              type="password"
              value={currentPassword}
              placeholder="Digite sua senha atual"
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </label>

          <label>
            Nova senha
            <input
              type="password"
              value={newPassword}
              placeholder="Digite sua nova senha"
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </label>

          <label>
            Confirmar nova senha
            <input
              type="password"
              value={confirmPassword}
              placeholder="Confirme a nova senha"
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </label>

          <button type="button" className="withdraw-password-btn" onClick={saveNewPassword} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar nova senha'}
          </button>

          {feedback ? (
            <div className={`withdraw-password-feedback ${feedback.type}`}>
              {feedback.message}
            </div>
          ) : null}
        </div>

        <p className="withdraw-password-note">
          Após alterar a senha, use a nova senha no próximo login.
        </p>
      </section>
    </main>
  )
}
