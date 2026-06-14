import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import './Dashboard.css'
import './CashInCheckout.css'
import { API_URL } from '../utils/apiUrl'


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

function getStatusInfo(status: PaymentStatus) {
  switch (status) {
    case 'paid':       return { label: 'Pago', icon: '✓', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' }
    case 'processing': return { label: 'Processando', icon: '⟳', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' }
    case 'expired':    return { label: 'Expirado', icon: '✕', color: '#f87171', bg: 'rgba(248,113,113,0.12)' }
    case 'canceled':   return { label: 'Cancelado', icon: '✕', color: '#f87171', bg: 'rgba(248,113,113,0.12)' }
    case 'failed':     return { label: 'Falhou', icon: '✕', color: '#f87171', bg: 'rgba(248,113,113,0.12)' }
    default:           return { label: 'Aguardando', icon: '◷', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' }
  }
}

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
  const [countdown, setCountdown]   = useState(600) // 10 min
  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const ticksRef  = useRef(0)

  const data          = (location.state ?? {}) as CheckoutState
  const amount        = Number(data.amount ?? 0)
  const transactionId = String(data.transactionId ?? '')
  const pixCode       = (data.qrCode ?? '').trim()
  const qrImage       = (data.qrImage ?? '').trim()

  const generatedQrUrl = useMemo(() => {
    if (!pixCode) return ''
    return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(pixCode)}&color=000000&bgcolor=FFFFFF&margin=2`
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
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
        if (data.balance != null) {
          updateStoredBalance(data.balance)
          setPaidBalance(data.balance)
        }
        setPaidMsg(true)
      } else if (isTerminal) {
        stopPolling()
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      }
    } catch { /* silencia erros de rede no polling */ }
  }, [transactionId, stopPolling])

  useEffect(() => {
    if (!hasData || !transactionId || transactionId === '-') return
    ticksRef.current = 0
    pollRef.current = setInterval(() => {
      ticksRef.current++
      if (ticksRef.current > 120) { stopPolling(); return }
      checkStatus()
    }, 5000)
    checkStatus()

    // countdown timer
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      stopPolling()
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    }
  }, [hasData, transactionId, checkStatus, stopPolling])

  const handleCopy = async () => {
    if (!pixCode) return
    try {
      await navigator.clipboard.writeText(pixCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch { setCopied(false) }
  }

  const statusInfo = getStatusInfo(status)
  const minutes = Math.floor(countdown / 60)
  const seconds = countdown % 60

  if (!hasData) {
    return (
      <main className="dash-app profile-page">
        <AppSidebar />
        <section className="dash-main">
          <div className="dash-content">
            <div className="checkout-container">
              <div className="checkout-empty-card">
                <div className="checkout-empty-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="48" height="48">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M15 9l-6 6M9 9l6 6" />
                  </svg>
                </div>
                <h2>Pagamento não encontrado</h2>
                <p>Dados de cobrança não encontrados. Volte e gere um novo pagamento.</p>
                <div className="checkout-empty-actions">
                  <button type="button" className="checkout-btn checkout-btn--secondary" onClick={() => navigate('/cashin')}>
                    Novo depósito
                  </button>
                  <button type="button" className="checkout-btn checkout-btn--primary" onClick={() => navigate('/dashboard')}>
                    Voltar ao início
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="dash-app profile-page">
      <AppSidebar />
      <section className="dash-main">
        <div className="dash-content">
          <div className="checkout-container">
            {/* Top Bar */}
            <header className="checkout-topbar">
              <button type="button" className="checkout-back-btn" onClick={() => navigate('/cashin')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <div className="checkout-topbar-info">
                <span className="checkout-topbar-brand">PIX</span>
                <span className="checkout-topbar-title">Pagamento</span>
              </div>
              <div className="checkout-status-badge" style={{ background: statusInfo.bg, color: statusInfo.color }}>
                <span className="checkout-status-icon">{statusInfo.icon}</span>
                {statusInfo.label}
              </div>
            </header>

            {/* Paid Success Banner */}
            {paidMsg && (
              <div className="checkout-success-banner">
                <div className="checkout-success-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <path d="M22 4L12 14.01l-3-3" />
                  </svg>
                </div>
                <div className="checkout-success-text">
                  <strong>Pagamento confirmado!</strong>
                  <span>{paidBalance != null ? `Novo saldo: ${formatBRL(paidBalance)}` : 'Saldo atualizado com sucesso.'}</span>
                </div>
                <button type="button" className="checkout-btn checkout-btn--success" onClick={() => navigate('/dashboard')}>
                  Ir ao início
                </button>
              </div>
            )}

            {/* Amount Card */}
            <div className="checkout-amount-card">
              <span className="checkout-amount-label">Valor do depósito</span>
              <span className="checkout-amount-value">{formatBRL(amount)}</span>
              {status === 'pending' && countdown > 0 && (
                <span className="checkout-timer">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  Expira em {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </span>
              )}
            </div>

            {/* QR Code Section */}
            <div className="checkout-qr-section">
              <div className="checkout-qr-card">
                <div className="checkout-qr-frame">
                  {generatedQrUrl ? (
                    <img src={generatedQrUrl} alt="QR Code PIX" className="checkout-qr-img" />
                  ) : qrImage ? (
                    <img src={qrImage} alt="QR Code PIX" className="checkout-qr-img" />
                  ) : (
                    <div className="checkout-qr-fallback">QR Code indisponível</div>
                  )}
                </div>
                <p className="checkout-qr-hint">Abra o app do seu banco e escaneie o QR Code acima</p>
              </div>
            </div>

            {/* Divider */}
            <div className="checkout-divider">
              <span className="checkout-divider-line" />
              <span className="checkout-divider-text">ou copie o código</span>
              <span className="checkout-divider-line" />
            </div>

            {/* PIX Copy Section */}
            <div className="checkout-pix-section">
              <label className="checkout-pix-label">Código PIX Copia e Cola</label>
              <div className="checkout-pix-box">
                <div className="checkout-pix-code">{pixCode}</div>
              </div>
              <button
                type="button"
                className={`checkout-copy-btn ${copied ? 'checkout-copy-btn--copied' : ''}`}
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    Código copiado!
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Copiar código PIX
                  </>
                )}
              </button>
            </div>

            {/* Instructions */}
            <div className="checkout-instructions">
              <h3 className="checkout-instructions-title">Como pagar</h3>
              <div className="checkout-step">
                <span className="checkout-step-num">1</span>
                <span className="checkout-step-text">Abra o app do seu banco ou carteira digital</span>
              </div>
              <div className="checkout-step">
                <span className="checkout-step-num">2</span>
                <span className="checkout-step-text">Escolha pagar com PIX e escaneie o QR Code ou cole o código</span>
              </div>
              <div className="checkout-step">
                <span className="checkout-step-num">3</span>
                <span className="checkout-step-text">Confirme o pagamento e aguarde a confirmação automática</span>
              </div>
            </div>

            {/* Transaction Info */}
            <div className="checkout-tx-info">
              <div className="checkout-tx-row">
                <span className="checkout-tx-label">ID da transação</span>
                <span className="checkout-tx-value">{transactionId}</span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="checkout-bottom-actions">
              <button type="button" className="checkout-btn checkout-btn--outline" onClick={() => navigate('/cashin')}>
                Novo pagamento
              </button>
              <button type="button" className="checkout-btn checkout-btn--primary" onClick={() => navigate('/dashboard')}>
                Voltar ao início
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
