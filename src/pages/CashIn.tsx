import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import './CashIn.css'
import { API_URL } from '../utils/apiUrl'

type StorageUser = {
  id: number
  name: string
  phone: string
}


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

  const normalizeAmountInput = (rawValue: string) => {
    const cleaned = rawValue.replace(/[^\d,]/g, '')
    const firstCommaIndex = cleaned.indexOf(',')
    if (firstCommaIndex === -1) return cleaned
    const integerPart = cleaned.slice(0, firstCommaIndex + 1)
    const decimalPart = cleaned.slice(firstCommaIndex + 1).replace(/,/g, '').slice(0, 2)
    return `${integerPart}${decimalPart}`
  }

  const handleAmountChange = (value: string) => {
    setAmount(normalizeAmountInput(value))
  }

  const formatAmountOnBlur = () => {
    const normalizedValue = Number(amount.replace(',', '.'))
    if (!Number.isFinite(normalizedValue) || normalizedValue <= 0) return
    setAmount(normalizedValue.toFixed(2).replace('.', ','))
  }

  const normalized = Number(amount.replace(',', '.'))
  const displayValue = Number.isFinite(normalized) && normalized > 0 ? normalized : 0
  const minLabel = minDepositAmount.toFixed(2).replace('.', ',')

  return (
    <main className="cashin-page">
      <section className="cashin-top-banner" aria-label="Banner Mancera">
        <img
          src="https://www.myperfumeshop.com.au/cdn/shop/articles/why-mancera-perfumes-are-the-ultimate-statement-of-luxury-125272.jpg?v=1725513212&width=2000"
          alt="Mancera luxury banner"
        />
      </section>

      <section className="cashin-card">
        <div className="cashin-layout">
          <form className="cashin-form" onSubmit={submitCashIn}>
            <div className="cashin-form-head">
              <p className="cashin-kicker">Nova recarga</p>
              <p>Escolha um valor, revise os detalhes e gere sua cobrança com segurança.</p>
            </div>

            <div className="cashin-label-row">
              <span>Valor do depósito</span>
            </div>

            <label className="cashin-amount-field">
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                onBlur={formatAmountOnBlur}
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

            <div className="cashin-hint">
              O pagamento é confirmado automaticamente em poucos segundos após a compensação do PIX.
            </div>

            <div className="cashin-actions">
              <button type="submit" className="cashin-submit" disabled={loading}>
                {loading ? 'Gerando cobrança...' : 'Gerar cobrança PIX'}
              </button>

            </div>

            {message ? (
              <p className={`cashin-message ${message.type}`} role="status" aria-live="polite">
                {message.text}
              </p>
            ) : null}
          </form>

          <aside className="cashin-side-panel">
            <h2>Resumo da cobrança</h2>
            <div className="summary-row">
              <span>Valor informado</span>
              <strong>
                {displayValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </strong>
            </div>
            <div className="summary-row">
              <span>Método</span>
              <strong>PIX instantâneo</strong>
            </div>
            <div className="summary-row total">
              <span>Total a pagar</span>
              <strong>
                {displayValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </strong>
            </div>

            <div className="cashin-security">
              <p>✅ Ambiente protegido para geração do QR Code.</p>
              <p>⚡ Compensação rápida após pagamento.</p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}
