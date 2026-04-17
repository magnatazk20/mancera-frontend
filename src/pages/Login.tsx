import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

interface AuthResponse {
  message?: string
  error?: string
  token?: string
  user?: { id: number; name: string; phone: string; is_admin?: number; isAdmin?: number | boolean }
}

export default function Login() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password, remember }),
      })

      const data = (await response.json()) as AuthResponse

      if (!response.ok) {
        setError(data.error ?? 'Falha ao fazer login.')
        return
      }

      // Salvar token e dados do usuário
      const storage = remember ? localStorage : sessionStorage
      storage.setItem('token', data.token ?? '')
      storage.setItem('user', JSON.stringify(data.user ?? {}))

      setMessage(data.message ?? 'Login realizado com sucesso.')

      // Redireciona para o destino salvo (ex: /roleta?codigo=...) ou dashboard
      const returnTo = sessionStorage.getItem('loginReturnTo') ?? '/dashboard'
      sessionStorage.removeItem('loginReturnTo')
      setTimeout(() => navigate(returnTo), 800)
    } catch {
      setError('Não foi possível conectar ao servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-shell auth-shell-no-banner">
        <section className="form-panel" aria-labelledby="login-title">
          <div className="login-invite-notice">
            👉 Convide amigos e ganhe recompensas<br />
            👉 Convide 1 amigo e ganhe <span className="login-invite-highlight">R$ 5,00</span> automaticamente<br />
            Assim que as tarefas forem concluídas, o bônus é liberado.
          </div>

          <h1 id="login-title">Login</h1>
          <p className="subtitle">Use sua conta para acessar o painel.</p>

          <form className="auth-form" onSubmit={onSubmit}>
            <label htmlFor="phone">Telefone</label>
            <div className="input-with-icon">
              <span className="input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="input-icon-svg">
                  <rect x="7" y="2.8" width="10" height="18.4" rx="2.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  <circle cx="12" cy="17.8" r="1.1" fill="currentColor" />
                </svg>
              </span>
              <input
                id="phone"
                type="tel"
                placeholder="(11) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                required
              />
            </div>

            <label htmlFor="password">Senha</label>
            <div className="input-with-icon">
              <span className="input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="input-icon-svg">
                  <rect x="5" y="10" width="14" height="10" rx="2.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M8 10V7.7a4 4 0 0 1 8 0V10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
              <input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <div className="row">
              <label className="remember-me" htmlFor="remember">
                <input
                  id="remember"
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Lembrar-me
              </label>
              <a href="#" className="text-link">
                Esqueci minha senha
              </a>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {message ? <p className="feedback success">{message}</p> : null}
          {error ? <p className="feedback error">{error}</p> : null}

          <div className="social-links-section" aria-label="Redes sociais oficiais">
            <p className="social-links-title">Siga nossas redes sociais</p>
            <div className="social-links-grid">
              <a
                href="https://www.instagram.com/pglmbr/"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link-button instagram"
              >
                Instagram
              </a>
              <a
                href="https://www.youtube.com/@PGLMBrasil"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link-button youtube"
              >
                YouTube
              </a>
            </div>
          </div>

          <p className="switch-page">
            Não tem conta?{' '}
            <Link to="/cadastro" className="text-link bold">
              Criar conta
            </Link>
          </p>
        </section>
      </section>
    </main>
  )
}
