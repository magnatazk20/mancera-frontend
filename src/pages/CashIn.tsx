import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import './CashIn.css'

type StorageUser = {
  id: number
  name: string
  phone: string
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

export default function CashIn() {
  const navigate = useNavigate()
  const [amount, setAmount] = useState('')
  const method = 'pix'
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [depositEnabled, setDepositEnabled] = useState(true)
  const [minDepositAmount, setMinDepositAmount] = useState(1)
  const [maxDepositAmount, setMaxDepositAmount] = useState(1000)
  const [quickAmounts, setQuickAmounts] = useState<number[]>([20, 50, 100, 200, 500])

  const user = useMemo(() => {
    const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')
    if (!raw) return null
    try {
      return JSON.parse(raw) as StorageUser
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    const loadDepositConfig = async () => {
      try {
        const token = localStorage.getItem('token') ?? sessionStorage.getItem('token')
        const response = await fetch(`${API_URL}/api/deposit-config`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })

        const data = await response.json().catch(() => ({} as any))
        if (!response.ok || !data?.ok || !data?.config) return

        const cfg = data.config as {
          depositEnabled?: boolean
          minDepositAmount?: number
          maxDepositAmount?: number
          quickPresetValues?: Array<number | string>
        }

        const min = Number(cfg.minDepositAmount ?? 1)
        const max = Number(cfg.maxDepositAmount ?? 1000)
        const presets = Array.isArray(cfg.quickPresetValues)
          ? cfg.quickPresetValues
              .map((v) => Number(v))
              .filter((v) => Number.isFinite(v) && v > 0)
              .map((v) => Number(v.toFixed(2)))
          : []

        setDepositEnabled(Boolean(cfg.depositEnabled ?? true))
        setMinDepositAmount(Number.isFinite(min) && min >= 0 ? min : 1)
        setMaxDepositAmount(Number.isFinite(max) && max > 0 ? max : 1000)
        if (presets.length > 0) setQuickAmounts(presets)
      } catch {
        // mantém fallback local
      }
    }

    loadDepositConfig()
  }, [])

  const submitCashIn = async (event: FormEvent) => {
    event.preventDefault()
    setMessage(null)

    if (!user?.id) {
      setMessage({ type: 'error', text: 'Usuário não autenticado. Faça login novamente.' })
      return
    }

    const normalized = Number(amount.replace(',', '.'))
    if (!Number.isFinite(normalized) || normalized <= 0) {
      setMessage({ type: 'error', text: 'Informe um valor válido maior que zero.' })
      return
    }

    if (!depositEnabled) {
      setMessage({ type: 'error', text: 'Depósitos estão desativados no momento.' })
      return
    }

    if (normalized < minDepositAmount) {
      setMessage({ type: 'error', text: `Valor mínimo para depósito é R$ ${minDepositAmount.toFixed(2).replace('.', ',')}.` })
      return
    }

    if (maxDepositAmount > 0 && normalized > maxDepositAmount) {
      setMessage({ type: 'error', text: `Valor máximo para depósito é R$ ${maxDepositAmount.toFixed(2).replace('.', ',')}.` })
      return
    }

    try {
      setLoading(true)

      const response = await fetch(`${API_URL}/api/CASHIN/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, amount: normalized, method }),
      })

      const data = (await response.json()) as {
        message?: string
        error?: string
        transactionId?: string | number | null
        qrCode?: string
        provider?: {
          data?: {
            payment_data?: {
              qr_code_base64?: string
              qr_code_image?: string
            }
          }
        }
      }

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error ?? 'Falha ao processar depósito.' })
        return
      }

      const qrImage =
        data.provider?.data?.payment_data?.qr_code_image ??
        data.provider?.data?.payment_data?.qr_code_base64 ??
        ''

      setAmount('')

      navigate('/cashin/checkout', {
        state: {
          amount: normalized,
          transactionId: data.transactionId ?? null,
          qrCode: data.qrCode ?? '',
          qrImage,
        },
      })
    } catch {
      setMessage({ type: 'error', text: 'Erro de conexão com servidor.' })
    } finally {
      setLoading(false)
    }
  }

  const normalized = Number(amount.replace(',', '.'))
  const displayValue = Number.isFinite(normalized) && normalized > 0 ? normalized : 0
  const minLabel = minDepositAmount.toFixed(2).replace('.', ',')
  const maxLabel =
    Number.isInteger(maxDepositAmount)
      ? `${Math.trunc(maxDepositAmount)},00`
      : maxDepositAmount.toFixed(2).replace('.', ',')

  return (
    <main className="cashin-page">
      <section className="cashin-card">
        <div className="cashin-layout">
          <form className="cashin-form" onSubmit={submitCashIn}>
            <div className="cashin-label-row">
              <span>Valor do depósito</span>
              <small>
                mín. R$ {minLabel} • máx. R$ {maxLabel}
              </small>
            </div>

            <label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Ex.: 50,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>

            <div className="cashin-quick-values">
              {quickAmounts.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`quick-chip ${displayValue === value ? 'active' : ''}`}
                  onClick={() => setAmount(String(value))}
                >
                  R$ {value}
                </button>
              ))}
            </div>

            <div className="cashin-method">
              <span className="cashin-method__label">Método de pagamento</span>
              <button
                type="button"
                className="cashin-method__btn is-active"
                aria-pressed="true"
                aria-label="Método de pagamento: PIX instantâneo"
              >
                <span className="cashin-method__icon" aria-hidden="true">
                  <svg viewBox="0 0 48 48" width="28" height="28" fill="none">
                    <path
                      d="M11.8 16.2 16.2 11.8a4 4 0 0 1 5.7 0L24 13.9l2.1-2.1a4 4 0 0 1 5.7 0l4.4 4.4a4 4 0 0 1 0 5.7L24 34 11.8 21.9a4 4 0 0 1 0-5.7Z"
                      fill="#32BCAD"
                    />
                    <path
                      d="M24 34 11.8 21.9a4 4 0 0 0 0 5.7l4.4 4.4a4 4 0 0 0 5.7 0L24 29.9l2.1 2.1a4 4 0 0 0 5.7 0l4.4-4.4a4 4 0 0 0 0-5.7L24 34Z"
                      fill="#32BCAD"
                      opacity="0.85"
                    />
                    <circle cx="24" cy="24" r="2.4" fill="#ffffff" />
                  </svg>
                </span>
                <span className="cashin-method__info">
                  <strong>VQPAY</strong>
                </span>
                <span className="cashin-method__check" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="5 12 10 17 19 8" />
                  </svg>
                </span>
              </button>
            </div>

            <button type="submit" className="cashin-submit" disabled={loading}>
              {loading ? 'Gerando cobrança...' : 'Gerar cobrança PIX'}
            </button>

            <button type="button" className="cashin-dashboard-btn" onClick={() => navigate('/dashboard')}>
              Ir para dashboard
            </button>

            {message ? (
              <p className={`cashin-message ${message.type}`} role="status" aria-live="polite">
                {message.text}
              </p>
            ) : null}
          </form>

          <aside className="cashin-side-panel">
            <h2>Resumo da operação</h2>
            <div className="summary-row">
              <span>Valor digitado</span>
              <strong>
                {displayValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </strong>
            </div>
            <div className="summary-row">
             
            </div>
            <div className="summary-row total">
              <span>Total a pagar</span>
              <strong>
                {displayValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </strong>
            </div>

          </aside>
        </div>
      </section>
    </main>
  )
}
