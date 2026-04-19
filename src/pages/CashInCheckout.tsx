import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import './CashInCheckout.css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

type CheckoutState = {
  amount?: number
  transactionId?: string | number | null
  qrCode?: string
  qrImage?: string
}

type PaymentStatus = 'pending' | 'processing' | 'paid' | 'expired' | 'canceled' | 'failed'

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function getChipInfo(status: PaymentStatus): { label: string; className: string } {
  switch (status) {
    case 'paid':       return { label: '✅ Pago',           className: 'status-chip status-paid'       }
    case 'processing': return { label: '🔄 Processando…',   className: 'status-chip status-processing'  }
    case 'expired':    return { label: '❌ Expirado',        className: 'status-chip status-expired'     }
    case 'canceled':   return { label: '❌ Cancelado',       className: 'status-chip status-expired'     }
    case 'failed':     return { label: '❌ Falhou',          className: 'status-chip status-expired'     }
    default:           return { label: '⏳ Aguardando pagamento', className: 'status-chip status-pending' }
  }
}

/* Atualiza o saldo no localStorage/sessionStorage sem forçar logout */
function updateStoredBalance(newBalance: number) {
  for (const storage of [localStorage, sessionStorage]) {
    const raw = storage.getItem('user')
    if (!raw) continue
    try {
      const user = JSON.parse(raw)
      user.balance = newBalance
      storage.setItem('user', JSON.stringify(user))
    } catch { /* ignora */ }
  }
}

export default function CashInCheckout() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const [copied, setCopied]         = useState(false)
  const [status, setStatus]         = useState<PaymentStatus>('pending')
  const [paidBalance, setPaidBalance] = useState<number | null>(null)
  const [paidMsg, setPaidMsg]       = useState(false)
  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const ticksRef  = useRef(0)

  const data          = (location.state ?? {}) as CheckoutState
  const amount        = Number(data.amount ?? 0)
  const transactionId = String(data.transactionId ?? '')
  const pixCode       = (data.qrCode ?? '').trim()
  const qrImage       = (data.qrImage ?? '').trim()

  const generatedQrUrl = useMemo(() => {
    if (!pixCode) return ''
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixCode)}&color=000000&bgcolor=FFFFFF&margin=1`
  }, [pixCode])

  const hasData = useMemo(() => amount > 0 && pixCode.length > 0, [amount, pixCode])

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }, [])

  const checkStatus = useCallback(async () => {
    if (!transactionId || transactionId === '-') return
    try {
      const res  = await fetch(`${API_URL}/api/cashin/status/${encodeURIComponent(transactionId)}`)
      const data = await res.json() as {
        ok?: boolean; status?: string; isPaid?: boolean; balance?: number | null
      }
      if (!res.ok || !data?.ok) return

      const newStatus = (data.status ?? 'pending') as PaymentStatus
      setStatus(newStatus)

      const isTerminal = ['paid', 'expired', 'canceled', 'failed'].includes(newStatus)

      if (data.isPaid) {
        stopPolling()
        if (data.balance != null) {
          updateStoredBalance(data.balance)
          setPaidBalance(data.balance)
        }
        setPaidMsg(true)
      } else if (isTerminal) {
        stopPolling()
      }
    } catch { /* silencia erros de rede no polling */ }
  }, [transactionId, stopPolling])

  /* inicia polling ao montar — para em 10 min ou em status terminal */
  useEffect(() => {
    if (!hasData || !transactionId || transactionId === '-') return
    ticksRef.current = 0
    pollRef.current = setInterval(() => {
      ticksRef.current++
      if (ticksRef.current > 120) { stopPolling(); return }
      checkStatus()
    }, 5000)
    /* primeira verificação imediata */
    checkStatus()
    return stopPolling
  }, [hasData, transactionId, checkStatus, stopPolling])

  const handleCopy = async () => {
    if (!pixCode) return
    try {
      await navigator.clipboard.writeText(pixCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { setCopied(false) }
  }

  const chipInfo = getChipInfo(status)

  if (!hasData) {
    return (
      <main className="cashin-checkout-page">
        <section className="bank-card">
          <h1>Pagamento PIX</h1>
          <p className="checkout-warning">
            Dados de cobrança não encontrados. Volte e gere um novo pagamento.
          </p>
          <div className="checkout-actions">
            <Link to="/cashin" className="btn secondary">Voltar para depósito</Link>
            <button type="button" className="btn primary" onClick={() => navigate('/dashboard')}>
              Ir para dashboard
            </button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="cashin-checkout-page">
      <section className="bank-card">
        <header className="bank-header">
          <div>
            <small className="bank-brand">PGLM • PIX</small>
            <h1>Concluir depósito</h1>
            <p>Escaneie o QR Code no seu banco ou copie o código PIX para pagar.</p>
          </div>
          <span className={chipInfo.className}>{chipInfo.label}</span>
        </header>

        {/* Banner de pagamento confirmado */}
        {paidMsg && (
          <div className="paid-banner">
            🎉 Pagamento confirmado! {paidBalance != null ? `Seu saldo agora é ${formatBRL(paidBalance)}.` : 'Saldo atualizado.'}
            <button
              type="button"
              className="btn primary"
              style={{ marginLeft: 16 }}
              onClick={() => navigate('/dashboard')}
            >
              Ir para dashboard
            </button>
          </div>
        )}

        <div className="checkout-grid">
          <article className="qr-panel">
            <h2>QR Code PIX</h2>
            <div className="qr-box">
              {generatedQrUrl ? (
                <img src={generatedQrUrl} alt="QR Code PIX" />
              ) : qrImage ? (
                <img src={qrImage} alt="QR Code PIX" />
              ) : (
                <div className="qr-fallback">
                  <span>QR disponível via código PIX abaixo</span>
                </div>
              )}
            </div>
            <p className="hint">Valor: <strong>{formatBRL(amount)}</strong></p>
            <p className="hint hint-small">
              ID: <span>{transactionId}</span>
            </p>
          </article>

          <article className="pix-panel">
            <h2>PIX Copia e Cola</h2>
            <textarea readOnly value={pixCode} />
            <button type="button" className="btn copy" onClick={handleCopy}>
              {copied ? 'Copiado ✅' : 'Copiar código PIX'}
            </button>

            <div className="checkout-actions">
              <Link to="/cashin" className="btn secondary">Gerar novo pagamento</Link>
              <button type="button" className="btn primary" onClick={() => navigate('/dashboard')}>
                Já paguei / Voltar ao dashboard
              </button>
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}
