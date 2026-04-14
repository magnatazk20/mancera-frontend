import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import ceoBanner from '../assets/ceo.jpg'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

interface AuthResponse {
  message?: string
  error?: string
  token?: string
  user?: { id: number; name: string; phone: string }
}

export default function Register() {
  const navigate = useNavigate()
  const [activeSlide, setActiveSlide] = useState(0)
  const [searchParams] = useSearchParams()
  const initialRef = (searchParams.get('ref') ?? '').trim().toUpperCase()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [referralCode, setReferralCode] = useState(initialRef)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const bannerSlides = [
    {
      id: 'premium',
      title: 'PGLM',
      subtitle: 'Cadastre-se e receba benefícios exclusivos.',
      kicker: 'BEM-VINDO À PLATAFORMA',
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
    setMessage('')
    setError('')

    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          password,
          referralCode: referralCode.trim() || undefined,
        }),
      })

      const data = (await response.json()) as AuthResponse

      if (!response.ok) {
        setError(data.error ?? 'Falha ao criar conta.')
        return
      }

      // Salvar token e dados do usuário
      localStorage.setItem('token', data.token ?? '')
      localStorage.setItem('user', JSON.stringify(data.user ?? {}))

      setMessage(data.message ?? 'Conta criada com sucesso!')

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

        <section className="form-panel" aria-labelledby="register-title">
          <h1 id="register-title">Cadastro</h1>
          <p className="subtitle">Preencha os dados para criar sua conta.</p>

          <form className="auth-form" onSubmit={onSubmit}>
            <label htmlFor="name">Nome completo</label>
            <div className="input-with-icon">
              <span className="input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="input-icon-svg">
                  <circle cx="12" cy="8" r="3.1" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M6.2 18.4c1-3 3.2-4.9 5.8-4.9s4.8 1.9 5.8 4.9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
              <input
                id="name"
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>

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
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            <label htmlFor="confirm">Confirmar senha</label>
            <div className="input-with-icon">
              <span className="input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="input-icon-svg">
                  <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M8.5 12.3l2.2 2.2l4.8-4.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <input
                id="confirm"
                type="password"
                placeholder="Repita a senha"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            <label htmlFor="referralCode">Código de convite (opcional)</label>
            <div className="input-with-icon">
              <span className="input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="input-icon-svg">
                  <path d="M4 8.2a2.2 2.2 0 0 0 0 4.4v3.2a1.8 1.8 0 0 0 1.8 1.8h12.4a1.8 1.8 0 0 0 1.8-1.8v-3.2a2.2 2.2 0 1 0 0-4.4V5a1.8 1.8 0 0 0-1.8-1.8H5.8A1.8 1.8 0 0 0 4 5z" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M9.2 7.2v9.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="1.4 1.4" />
                </svg>
              </span>
              <input
                id="referralCode"
                type="text"
                placeholder="Ex.: 342A6L31M"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                autoComplete="off"
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          {message ? <p className="feedback success">{message}</p> : null}
          {error ? <p className="feedback error">{error}</p> : null}

          <p className="switch-page">
            Já tem conta?{' '}
            <Link to="/" className="text-link bold">
              Fazer login
            </Link>
          </p>
        </section>
      </section>
    </main>
  )
}
