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
            <input
              id="name"
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />

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
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />

            <label htmlFor="confirm">Confirmar senha</label>
            <input
              id="confirm"
              type="password"
              placeholder="Repita a senha"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />

            <label htmlFor="referralCode">Código de convite (opcional)</label>
            <input
              id="referralCode"
              type="text"
              placeholder="Ex.: 342A6L31M"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              autoComplete="off"
            />

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
