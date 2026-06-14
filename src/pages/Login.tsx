import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Login.css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

interface AuthResponse {
  message?: string
  error?: string
  token?: string
  user?: { id: number; name: string; phone: string; is_admin?: number; isAdmin?: number | boolean }
}

type ModalType = 'success' | 'error' | null

export default function Login() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [modal, setModal] = useState<{ type: ModalType; message: string }>({ type: null, message: '' })
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setModal({ type: null, message: '' })

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password, remember }),
      })

      const data = (await response.json()) as AuthResponse

      if (!response.ok) {
        setModal({ type: 'error', message: data.error ?? 'Falha ao fazer login.' })
        return
      }

      const storage = remember ? localStorage : sessionStorage
      storage.setItem('token', data.token ?? '')
      storage.setItem('user', JSON.stringify(data.user ?? {}))

      setModal({ type: 'success', message: data.message ?? 'Login realizado com sucesso!' })

      const returnTo = sessionStorage.getItem('loginReturnTo') ?? '/dashboard'
      sessionStorage.removeItem('loginReturnTo')
      setTimeout(() => navigate(returnTo), 1200)
    } catch {
      setModal({ type: 'error', message: 'Erro de conexão com o servidor.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-amber" aria-labelledby="login-title">
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

      <h1 id="login-title" className="login-amber__title">
        Fazer login
      </h1>

      <form className="login-amber__form" onSubmit={onSubmit}>
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
            placeholder="Digite seu número de telefone"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d+()\s-]/g, ''))}
            inputMode="numeric"
            autoComplete="tel"
            required
          />
        </div>

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
            placeholder="Digite sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
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

        <label className="la-check">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <span className="la-check__box" aria-hidden="true">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8.5l3.2 3.2L13 5" />
            </svg>
          </span>
          <span className="la-check__label">Lembrar meu acesso</span>
        </label>

        <div className="login-amber__actions">
          <button type="submit" className="la-submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <p className="la-register">
            Não tem conta?{' '}
            <Link to="/register" className="la-register__link">
              Criar conta
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
