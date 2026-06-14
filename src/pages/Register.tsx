import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import './Login.css'
import { API_URL } from '../utils/apiUrl'


interface AuthResponse {
  message?: string
  error?: string
  token?: string
  user?: { id: number; name: string; phone: string }
}

type ModalType = 'success' | 'error' | null

export default function Register() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialRef = (searchParams.get('ref') ?? '').trim().toUpperCase()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [referralCode, setReferralCode] = useState(initialRef)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [modal, setModal] = useState<{ type: ModalType; message: string }>({ type: null, message: '' })
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setModal({ type: null, message: '' })

    if (password !== confirm) {
      setModal({ type: 'error', message: 'As senhas não coincidem.' })
      return
    }

    if (password.length < 6) {
      setModal({ type: 'error', message: 'A senha deve ter no mínimo 6 caracteres.' })
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
        setModal({ type: 'error', message: data.error ?? 'Falha ao criar conta.' })
        return
      }

      localStorage.setItem('token', data.token ?? '')
      localStorage.setItem('user', JSON.stringify(data.user ?? {}))

      setModal({ type: 'success', message: data.message ?? 'Conta criada com sucesso!' })

      setTimeout(() => navigate('/dashboard'), 1200)
    } catch {
      setModal({ type: 'error', message: 'Erro de conexão com o servidor.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-amber" aria-labelledby="register-title">
      <div className="login-amber__hero">
        <div className="login-amber__hero-video-wrap" aria-hidden="true">
          <iframe
            src="https://player.vimeo.com/video/723441502?autoplay=1&loop=1&muted=1&background=1&quality=auto"
            className="login-amber__video"
            allow="autoplay; fullscreen"
            title="Mancera Video"
          />
          <div className="login-amber__hero-overlay">
            <span className="login-amber__hero-mark">MANCERA</span>
            <span className="login-amber__hero-sub">Essência da elegância</span>
          </div>
        </div>
      </div>

      <h1 id="register-title" className="login-amber__title">
        Criar conta
      </h1>

      <form className="login-amber__form" onSubmit={onSubmit}>
        {/* Nome */}
        <div className="la-field">
          <span className="la-field__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </span>
          <input
            id="name"
            type="text"
            placeholder="Seu nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
          />
        </div>

        {/* Telefone com prefixo 55 */}
        <div className="la-field">
          <span className="la-field__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.86 19.86 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </span>
          <span className="la-field__prefix">
            <span className="la-field__ddi">55</span>
            <span className="la-field__ddi-arrow" aria-hidden="true">▾</span>
          </span>
          <input
            id="phone"
            type="tel"
            placeholder="Seu número de telefone"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d+()\s-]/g, ''))}
            inputMode="numeric"
            autoComplete="tel"
            required
          />
        </div>

        {/* Senha */}
        <div className="la-field">
          <span className="la-field__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="11" width="16" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              <circle cx="12" cy="16" r="1.2" fill="currentColor" stroke="none" />
            </svg>
          </span>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Crie uma senha (mínimo 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <button
            type="button"
            className="la-field__right-icon"
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a19.77 19.77 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a19.77 19.77 0 0 1-3.17 4.19" />
                <path d="M1 1l22 22" />
                <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88" />
              </svg>
            )}
          </button>
        </div>

        {/* Confirmar senha */}
        <div className="la-field">
          <span className="la-field__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <path d="m9 11 3 3L22 4" />
            </svg>
          </span>
          <input
            id="confirm"
            type={showConfirm ? 'text' : 'password'}
            placeholder="Confirme sua senha"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
          <button
            type="button"
            className="la-field__right-icon"
            aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}
            onClick={() => setShowConfirm((v) => !v)}
          >
            {showConfirm ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a19.77 19.77 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a19.77 19.77 0 0 1-3.17 4.19" />
                <path d="M1 1l22 22" />
                <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88" />
              </svg>
            )}
          </button>
        </div>

        {/* Código de convite (opcional) */}
        <div className="la-field">
          <span className="la-field__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 12V8H6a2 2 0 0 1 0-4h12v4" />
              <path d="M4 6v12a2 2 0 0 0 2 2h14v-4" />
              <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
            </svg>
          </span>
          <input
            id="referralCode"
            type="text"
            placeholder="Código de convite (opcional)"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            autoComplete="off"
          />
        </div>

        <div className="login-amber__actions">
          <button type="submit" className="la-submit" disabled={loading}>
            {loading ? 'Criando conta...' : 'Criar minha conta'}
          </button>

          <p className="la-register">
            Já tem uma conta?{' '}
            <Link to="/" className="la-register__link">
              Fazer login
            </Link>
          </p>
        </div>
      </form>

      {modal.type && (
        <div className="la-modal-overlay" role="dialog" aria-modal="true">
          <div className={`la-modal la-modal--${modal.type}`}>
            <div className="la-modal__icon">
              {modal.type === 'success' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
              )}
            </div>
            <p className={`la-modal__title la-modal__title--${modal.type}`}>
              {modal.type === 'success' ? 'Sucesso!' : 'Erro'}
            </p>
            <p className="la-modal__msg">{modal.message}</p>
            <button
              type="button"
              className="la-modal__btn"
              onClick={() => setModal({ type: null, message: '' })}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
