import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import './Tasks.css'
import './GiftVouchers.css'

type StoredUser = {
  id: number
  name: string
  phone: string
}

type GiftVoucher = {
  id: number
  name: string
  description: string
  imageUrl: string
  price: number
  discountCoupon: string
  redeemRewardValue: number
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function GiftVouchers() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [vouchers, setVouchers] = useState<GiftVoucher[]>([])
  const [buyingId, setBuyingId] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const user = useMemo(() => {
    const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')
    if (!raw) return null
    try {
      return JSON.parse(raw) as StoredUser
    } catch {
      return null
    }
  }, [])

  const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''

  useEffect(() => {
    if (!user?.id || !token) {
      navigate('/')
      return
    }

    const loadVouchers = async () => {
      setLoading(true)
      try {
        const res = await fetch(`${API_URL}/api/gift-vouchers`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json() as { ok?: boolean; vouchers?: GiftVoucher[]; error?: string }

        if (!res.ok || !data?.ok) {
          setFeedback({ type: 'error', message: data?.error || 'Erro ao carregar vales presentes.' })
          setVouchers([])
          return
        }

        setVouchers(Array.isArray(data.vouchers) ? data.vouchers : [])
      } catch {
        setFeedback({ type: 'error', message: 'Erro de conexão ao carregar vales presentes.' })
        setVouchers([])
      } finally {
        setLoading(false)
      }
    }

    loadVouchers()
  }, [navigate, token, user?.id])

  const buyVoucher = async (giftVoucherId: number) => {
    if (!user?.id) return
    setBuyingId(giftVoucherId)
    setFeedback(null)

    try {
      const res = await fetch(`${API_URL}/api/gift-vouchers/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          giftVoucherId,
        }),
      })

      const data = await res.json() as { ok?: boolean; message?: string; error?: string }

      if (!res.ok || !data?.ok) {
        setFeedback({ type: 'error', message: data?.error || 'Não foi possível comprar o vale.' })
        return
      }

      setFeedback({ type: 'success', message: data?.message || 'Vale presente comprado com sucesso.' })
    } catch {
      setFeedback({ type: 'error', message: 'Erro de conexão ao comprar vale presente.' })
    } finally {
      setBuyingId(null)
    }
  }

  return (
    <main className="tasks-page gift-vouchers-page">
      <AppSidebar />
      <header className="tasks-header gift-vouchers-header">
        <div>
          <p className="tasks-kicker">Compras</p>
          <h1>Vales Presentes</h1>
          <span className="tasks-subtitle">Escolha um vale presente para comprar e resgatar recompensas</span>
        </div>
        <div className="tasks-header-actions">
          <button className="btn ghost" onClick={() => navigate('/profile')}>
            Voltar
          </button>
        </div>
      </header>

      {feedback ? (
        <div className={`gift-toast ${feedback.type === 'success' ? 'success' : 'error'}`} role="status" aria-live="polite">
          {feedback.message}
        </div>
      ) : null}

      {loading ? (
        <div className="vip-inline-message">Carregando vales presentes...</div>
      ) : (
        <section className="gift-vouchers-list">
          {vouchers.map((voucher) => (
            <article key={voucher.id} className="gift-voucher-card">
              <img
                className="gift-voucher-image"
                src={voucher.imageUrl || 'https://via.placeholder.com/640x360?text=Vale+Presente'}
                alt={voucher.name}
              />
              <div className="gift-voucher-content">
                <h3 className="gift-voucher-title">{voucher.name}</h3>
                <p className="gift-voucher-description">{voucher.description}</p>
                <div className="gift-voucher-meta">
                  <span><b>Valor:</b> {formatBRL(voucher.price)}</span>
                  <span><b>Cupom:</b> {voucher.discountCoupon}</span>
                  <span><b>Ganho no resgate:</b> {formatBRL(voucher.redeemRewardValue)}</span>
                </div>
                <button
                  type="button"
                  className="btn primary gift-voucher-buy-btn"
                  onClick={() => buyVoucher(voucher.id)}
                  disabled={buyingId === voucher.id}
                >
                  {buyingId === voucher.id ? 'Comprando...' : 'Comprar'}
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}
