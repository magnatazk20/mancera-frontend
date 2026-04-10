import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import './Dashboard.css'

type StoredUser = {
  id: number
  name: string
  phone: string
}

type CycleProduct = {
  id: number
  name: string
  description: string
  amount: number
  profit: number
  cycleDays: number
  imageUrl: string
  isActive: boolean
  sortOrder: number
}

type PlanCategory = 'normal' | 'vip' | 'vip_day'

const getPlanCategory = (plan: CycleProduct): PlanCategory => {
  const name = String(plan.name ?? '').toLowerCase().trim()
  if (name.includes('vip do dia')) return 'vip_day'
  if (name.includes('vip')) return 'vip'
  return 'normal'
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

export default function CycleProducts() {
  const navigate = useNavigate()
  const [user, setUser] = useState<StoredUser | null>(null)
  const [cyclePlans, setCyclePlans] = useState<CycleProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<CycleProduct | null>(null)
  const [isBuying, setIsBuying] = useState(false)
  const [activeCategory, setActiveCategory] = useState<PlanCategory>('normal')

  useEffect(() => {
    const token = localStorage.getItem('token') ?? sessionStorage.getItem('token')
    const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')

    if (!token || !raw) {
      navigate('/')
      return
    }

    try {
      setUser(JSON.parse(raw) as StoredUser)
    } catch {
      navigate('/')
    }
  }, [navigate])

  useEffect(() => {
    if (!user?.id) return

    const loadCyclePlans = async () => {
      setLoading(true)
      try {
        const response = await fetch(`${API_URL}/api/dashboard/cycle-products`)
        if (!response.ok) {
          setCyclePlans([])
          return
        }
        const data = (await response.json()) as { ok?: boolean; products?: CycleProduct[] }
        if (!data?.ok || !Array.isArray(data.products)) {
          setCyclePlans([])
          return
        }
        setCyclePlans(data.products)
      } catch {
        setCyclePlans([])
      } finally {
        setLoading(false)
      }
    }

    loadCyclePlans()
  }, [user?.id])

  const formatBRL = (value: number) =>
    Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const formatDateTime = (date: Date) =>
    date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const closePurchaseModal = () => {
    if (isBuying) return
    setSelectedPlan(null)
  }

  const confirmBuyCycle = async () => {
    if (!user?.id || !selectedPlan || isBuying) return

    setIsBuying(true)
    try {
      const response = await fetch(`${API_URL}/api/cycle-products/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          cycleProductId: selectedPlan.id,
        }),
      })

      const data = (await response.json()) as {
        ok?: boolean
        error?: string
        message?: string
      }

      if (!response.ok || !data?.ok) {
        alert(data?.error ?? 'Não foi possível adquirir este ciclo.')
        return
      }

      alert(data?.message ?? 'Ciclo adquirido com sucesso.')
      setSelectedPlan(null)
    } catch {
      alert('Erro de conexão ao adquirir ciclo.')
    } finally {
      setIsBuying(false)
    }
  }

  const filteredCyclePlans = useMemo(
    () => cyclePlans.filter((plan) => getPlanCategory(plan) === activeCategory),
    [cyclePlans, activeCategory]
  )

  if (!user) return null

  return (
    <main className="dash-app">
      <section className="dash-main">
        <AppSidebar />

        <div className="dash-content">
          <section className="welcome-card" style={{ marginTop: 14 }}>
            <h1 style={{ fontSize: 20, marginBottom: 10 }}>Produtos de ciclos</h1>
            <p style={{ marginBottom: 12 }}>Os mesmos produtos exibidos no Dashboard.</p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 8,
                marginBottom: 14,
              }}
            >
              <button
                type="button"
                onClick={() => setActiveCategory('normal')}
                style={{
                  border: activeCategory === 'normal' ? '2px solid #0b63ff' : '1px solid #cbd5e1',
                  background: activeCategory === 'normal' ? 'linear-gradient(135deg, #e8f0ff 0%, #dbeafe 100%)' : '#fff',
                  color: '#0f172a',
                  borderRadius: 12,
                  padding: '10px 8px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 180ms ease',
                  transform: activeCategory === 'normal' ? 'translateY(-1px) scale(1.02)' : 'translateY(0) scale(1)',
                  boxShadow: activeCategory === 'normal' ? '0 8px 20px rgba(11,99,255,0.22)' : '0 2px 8px rgba(15,23,42,0.06)',
                }}
              >
                Plano normal
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('vip')}
                style={{
                  border: activeCategory === 'vip' ? '2px solid #0b63ff' : '1px solid #cbd5e1',
                  background: activeCategory === 'vip' ? 'linear-gradient(135deg, #e8f0ff 0%, #dbeafe 100%)' : '#fff',
                  color: '#0f172a',
                  borderRadius: 12,
                  padding: '10px 8px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 180ms ease',
                  transform: activeCategory === 'vip' ? 'translateY(-1px) scale(1.02)' : 'translateY(0) scale(1)',
                  boxShadow: activeCategory === 'vip' ? '0 8px 20px rgba(11,99,255,0.22)' : '0 2px 8px rgba(15,23,42,0.06)',
                }}
              >
                Plano VIP
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('vip_day')}
                style={{
                  border: activeCategory === 'vip_day' ? '2px solid #0b63ff' : '1px solid #cbd5e1',
                  background: activeCategory === 'vip_day' ? 'linear-gradient(135deg, #e8f0ff 0%, #dbeafe 100%)' : '#fff',
                  color: '#0f172a',
                  borderRadius: 12,
                  padding: '10px 8px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 180ms ease',
                  transform: activeCategory === 'vip_day' ? 'translateY(-1px) scale(1.02)' : 'translateY(0) scale(1)',
                  boxShadow: activeCategory === 'vip_day' ? '0 8px 20px rgba(11,99,255,0.22)' : '0 2px 8px rgba(15,23,42,0.06)',
                }}
              >
                VIP do dia
              </button>
            </div>

            {loading ? (
              <p style={{ color: '#6b7280' }}>Carregando produtos...</p>
            ) : filteredCyclePlans.length === 0 ? (
              <p style={{ color: '#6b7280' }}>Nenhum plano disponível nesta categoria.</p>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {filteredCyclePlans.map((plan, index) => {
                  const compras = Math.max(1, Math.floor((index + 1) * 2))
                  const estoque = Math.max(120, 1000 - index * 37)
                  const progresso = Math.min(95, 25 + index * 10)

                  return (
                    <article
                      key={plan.id}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: 12,
                        overflow: 'hidden',
                        background: '#fff',
                      }}
                    >
                      <img
                        src={plan.imageUrl}
                        alt={plan.name}
                        style={{
                          width: '100%',
                          height: 120,
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                      <div style={{ padding: 10 }}>
                        <div style={{ color: '#334155', fontSize: 18, fontWeight: 500 }}>{plan.name}</div>

                        <div
                          style={{
                            marginTop: 8,
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                            gap: 8,
                            textAlign: 'center',
                          }}
                        >
                          <div>
                            <div style={{ color: '#ff3b00', fontSize: 24, fontWeight: 700, lineHeight: 1.1 }}>
                              {Math.round(plan.amount)}
                            </div>
                            <div style={{ color: '#334155', fontSize: 16, lineHeight: 1 }}>Montante</div>
                          </div>
                          <div>
                            <div style={{ color: '#ff3b00', fontSize: 24, fontWeight: 700, lineHeight: 1.1 }}>
                              {plan.cycleDays} dias
                            </div>
                            <div style={{ color: '#334155', fontSize: 16, lineHeight: 1 }}>Ciclo</div>
                          </div>
                          <div>
                            <div style={{ color: '#ff3b00', fontSize: 24, fontWeight: 700, lineHeight: 1.1 }}>
                              R${Math.round(plan.profit)}
                            </div>
                            <div style={{ color: '#334155', fontSize: 16, lineHeight: 1 }}>Lucro</div>
                          </div>
                        </div>

                        <div
                          style={{
                            marginTop: 12,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10,
                          }}
                        >
                          <div style={{ color: '#64748b', fontSize: 16, lineHeight: 1.5 }}>
                            <div>
                              Quantidade de Compras: <span style={{ color: '#0f172a', fontWeight: 700 }}>{compras}</span>
                            </div>
                            <div>
                              Quantidade de Estoque: <span style={{ color: '#0f172a', fontWeight: 700 }}>{estoque}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedPlan(plan)}
                            style={{
                              border: 'none',
                              borderRadius: 14,
                              background: '#0b63ff',
                              color: '#fff',
                              fontWeight: 800,
                              fontSize: 20,
                              padding: '10px 16px',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Investir
                          </button>
                        </div>

                        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              flex: 1,
                              height: 10,
                              borderRadius: 999,
                              background: '#eceff3',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${progresso}%`,
                                height: '100%',
                                background: '#ff9100',
                                borderRadius: 999,
                              }}
                            />
                          </div>
                          <div style={{ color: '#334155', fontSize: 15 }}>progresso {progresso}%</div>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </section>

      {selectedPlan ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 9999,
          }}
          onClick={closePurchaseModal}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 420,
              background: '#fff',
              borderRadius: 12,
              padding: 16,
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: 0, color: '#0f172a' }}>Confirmar investimento</h3>
            <p style={{ marginTop: 6, color: '#64748b' }}>{selectedPlan.name}</p>

            <div style={{ marginTop: 12, display: 'grid', gap: 8, color: '#1e293b', fontSize: 14 }}>
              <div><strong>Montante:</strong> {formatBRL(selectedPlan.amount)}</div>
              <div><strong>Lucro final:</strong> {formatBRL(selectedPlan.profit)}</div>
              <div><strong>Início do ciclo:</strong> {formatDateTime(new Date())}</div>
              <div>
                <strong>Fim do ciclo:</strong>{' '}
                {formatDateTime(new Date(Date.now() + selectedPlan.cycleDays * 24 * 60 * 60 * 1000))}
              </div>
              <div><strong>Duração:</strong> {selectedPlan.cycleDays} dias</div>
            </div>

            <div style={{ marginTop: 14, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={closePurchaseModal}
                disabled={isBuying}
                style={{
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  color: '#334155',
                  borderRadius: 8,
                  padding: '10px 14px',
                  cursor: isBuying ? 'not-allowed' : 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmBuyCycle}
                disabled={isBuying}
                style={{
                  border: 'none',
                  background: '#0b63ff',
                  color: '#fff',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontWeight: 700,
                  cursor: isBuying ? 'not-allowed' : 'pointer',
                }}
              >
                {isBuying ? 'Processando...' : 'Confirmar compra'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}
