import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const LOGIN_BANNER_IMAGES = [
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80',
]

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
  const [activeBannerIndex, setActiveBannerIndex] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % LOGIN_BANNER_IMAGES.length)
    }, 3800)

    return () => window.clearInterval(timer)
  }, [])

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

      // Redirecionar para o dashboard após 800ms
      setTimeout(() => navigate('/dashboard'), 800)
    } catch {
      setError('Não foi possível conectar ao servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <aside className="hero-panel login-banner-panel" aria-hidden="true">
          <div className="login-banner-track" style={{ transform: `translateX(-${activeBannerIndex * 100}%)` }}>
            {LOGIN_BANNER_IMAGES.map((imageUrl, index) => (
              <div key={imageUrl} className="login-banner-slide">
                <img src={imageUrl} alt={`Banner profissional ${index + 1}`} loading="lazy" />
              </div>
            ))}
          </div>

          <div className="login-banner-overlay">
            <h2>Ambiente profissional para acessar sua conta</h2>
            <p>Interface moderna com foco em desempenho e confiança.</p>
          </div>

          <div className="login-banner-dots">
            {LOGIN_BANNER_IMAGES.map((_, index) => (
              <span key={index} className={`login-banner-dot ${index === activeBannerIndex ? 'active' : ''}`} />
            ))}
          </div>
        </aside>

        <section className="form-panel" aria-labelledby="login-title">
          <h1 id="login-title">Login</h1>
          <p className="subtitle">Use sua conta para acessar o painel.</p>

          <form className="auth-form" onSubmit={onSubmit}>
            <label htmlFor="phone">Telefone</label>
            <input
              id="phone"
              type="tel"
              placeholder="(11) 99999-9999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              required
            />

            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />

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
