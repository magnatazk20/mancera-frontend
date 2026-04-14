import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ceoBanner from '../assets/ceo.jpg'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

interface AuthResponse {
  message?: string
  error?: string
  token?: string
  user?: { id: number; name: string; phone: string; is_admin?: number; isAdmin?: number | boolean }
}

export default function Login() {
  const navigate = useNavigate()
  const [activeSlide, setActiveSlide] = useState(0)
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const bannerSlides = [
    {
      id: 'premium',
      title: 'PGLM',
      subtitle: 'Acesso seguro, experiência premium.',
      kicker: 'PLATAFORMA OFICIAL',
      image: '',
    },
    {
      id: 'ceo',
      title: 'Liderança PGLM',
      subtitle: 'Conheça a visão por trás da plataforma.',
      kicker: 'DESTAQUE',
      image: ceoBanner,
    },
    {
      id: 'community',
      title: 'Comunidade Forte',
      subtitle: 'Conecte-se e cresça com a PGLM.',
      kicker: 'EVOLUÇÃO',
      image: '',
    },
  ]

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % bannerSlides.length)
    }, 3800)

    return () => window.clearInterval(interval)
  }, [bannerSlides.length])

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
          <div className="pglm-banner-slider-track" style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
            {bannerSlides.map((slide) => (
              <div key={slide.id} className="pglm-banner-slide">
                {slide.image ? (
                  <img src={slide.image} alt="" className="pglm-banner-slide-image" />
                ) : null}
                <div className="pglm-banner-bg-glow" />
                <div className="pglm-banner-content">
                  <p className="pglm-banner-kicker">{slide.kicker}</p>
                  <h2 className="pglm-banner-title">{slide.title}</h2>
                  <p className="pglm-banner-subtitle">{slide.subtitle}</p>
                </div>
              </div>
            ))}
          </div>

          {activeSlide === 0 ? (
            <>
              <svg className="pglm-banner-lightning left" viewBox="0 0 120 220" aria-hidden="true">
                <path d="M72 8L42 98h28l-20 114l62-116H82L102 8z" />
              </svg>

              <svg className="pglm-banner-lightning right" viewBox="0 0 120 220" aria-hidden="true">
                <path d="M72 8L42 98h28l-20 114l62-116H82L102 8z" />
              </svg>
            </>
          ) : null}

          <div className="pglm-banner-dots" aria-hidden="true">
            {bannerSlides.map((slide, index) => (
              <span
                key={slide.id}
                className={`pglm-banner-dot${index === activeSlide ? ' active' : ''}`}
              />
            ))}
          </div>
        </aside>

        <section className="form-panel" aria-labelledby="login-title">
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
              <a
                href="https://t.me/pglm001"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link-button telegram"
              >
                Telegram
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
