import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import './Dashboard.css'
import './CycleProducts.css'
import { API_URL } from '../utils/apiUrl'

type StoredUser = {
  id: number
  name: string
  phone: string
}

type PlanCategory = 'normal' | 'vip' | 'vip_day'

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
  planType: PlanCategory
  requireCommissionLevel1Count: number
  requireCommissionLevel2Count: number
  requireCommissionLevel3Count: number
  stockQuantity: number
  maxPurchasesPerUser: number
  expiresAt: string | null
  minAmount: number
  maxAmount: number
  profitPercent: number
  mancecoinReward: number
}

const normalizePlanType = (value: unknown): PlanCategory => {
  const raw = String(value ?? '').trim().toLowerCase()
  if (raw === 'vip') return 'vip'
  if (raw === 'vip_day') return 'vip_day'
  return 'normal'
}


export default function CycleProducts() {
  const navigate = useNavigate()
  const [user, setUser] = useState<StoredUser | null>(null)
  const [cyclePlans, setCyclePlans] = useState<CycleProduct[]>([])
  const [initialStock, setInitialStock] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<CycleProduct | null>(null)
  const [isBuying, setIsBuying] = useState(false)
  const [activeCategory, setActiveCategory] = useState<PlanCategory>('normal')
  const [userInviteCount, setUserInviteCount] = useState<{ level1: number; level2: number; level3: number } | null>(null)
  const [myPurchases, setMyPurchases] = useState<Record<number, number>>({})
  const [userVipLevel, setUserVipLevel] = useState<number | null>(null)

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

    const loadUserVipLevel = async () => {
      try {
        const token = localStorage.getItem('token') ?? sessionStorage.getItem('token')
        const res = await fetch(`${API_URL}/api/user/summary/${user.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const data = await res.json().catch(() => ({})) as { vipLevelId?: number }
        if (res.ok && data?.vipLevelId != null) {
          setUserVipLevel(Number(data.vipLevelId))
        }
      } catch {
        // silencioso
      }
    }

    loadUserVipLevel()
  }, [user?.id])

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
        const data = (await response.json()) as { ok?: boolean; products?: Array<Record<string, unknown>> }
        if (!data?.ok || !Array.isArray(data.products)) {
          setCyclePlans([])
          return
        }

        const mappedPlans: CycleProduct[] = data.products.map((item) => ({
          id: Number(item.id ?? 0),
          name: String(item.name ?? ''),
          description: String(item.description ?? ''),
          amount: Number(item.amount ?? 0),
          profit: Number(item.profit ?? 0),
          cycleDays: Number(item.cycleDays ?? 0),
          imageUrl: String(item.imageUrl ?? ''),
          isActive: Boolean(item.isActive),
          sortOrder: Number(item.sortOrder ?? 0),
          planType: normalizePlanType(item.planType),
          requireCommissionLevel1Count: Number(item.requireCommissionLevel1Count ?? 0),
          requireCommissionLevel2Count: Number(item.requireCommissionLevel2Count ?? 0),
          requireCommissionLevel3Count: Number(item.requireCommissionLevel3Count ?? 0),
          stockQuantity: Number(item.stockQuantity ?? 0),
          maxPurchasesPerUser: Number(item.maxPurchasesPerUser ?? 0),
          expiresAt: item.expiresAt == null ? null : String(item.expiresAt),
          minAmount: Number(item.minAmount ?? 0),
          maxAmount: Number(item.maxAmount ?? 0),
          profitPercent: Number(item.profitPercent ?? 0),
          mancecoinReward: Number(item.mancecoinReward ?? 0),
        }))

        setCyclePlans(mappedPlans)
        const stockMap: Record<number, number> = {}
        mappedPlans.forEach((p) => { stockMap[p.id] = p.stockQuantity })
        setInitialStock(stockMap)
      } catch {
        setCyclePlans([])
      } finally {
        setLoading(false)
      }
    }

    loadCyclePlans()

    const loadInviteCounts = async () => {
      try {
        const token = localStorage.getItem('token') ?? sessionStorage.getItem('token')
        const res = await fetch(`${API_URL}/api/user/invite-counts/${user.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const data = await res.json().catch(() => ({})) as {
          ok?: boolean
          level1?: number
          level2?: number
          level3?: number
        }
        if (res.ok && data?.ok) {
          setUserInviteCount({
            level1: Number(data.level1 ?? 0),
            level2: Number(data.level2 ?? 0),
            level3: Number(data.level3 ?? 0),
          })
        }
      } catch {
        // silencioso
      }
    }

    loadInviteCounts()

    const loadMyPurchases = async () => {
      try {
        const token = localStorage.getItem('token') ?? sessionStorage.getItem('token')
        if (!token) return
        const res = await fetch(`${API_URL}/api/cycle-products/my-purchases/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json().catch(() => ({})) as { ok?: boolean; purchases?: Record<number, number> }
        if (res.ok && data?.ok && data.purchases) {
          setMyPurchases(data.purchases)
        }
      } catch {
        // silencioso
      }
    }

    loadMyPurchases()
  }, [user?.id])

  const formatBRL = (value: number) =>
    Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const formatDateTime = (date: Date) =>
    date.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  const closePurchaseModal = () => {
    if (isBuying) return
    setSelectedPlan(null)
  }

  const confirmBuyCycle = async () => {
    if (!user?.id || !selectedPlan || isBuying) return

    setIsBuying(true)
    const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''
    try {
      const response = await fetch(`${API_URL}/api/cycle-products/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          userId: user.id,
          cycleProductId: selectedPlan.id,
          investAmount: selectedPlan.amount,
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

      setCyclePlans((prev) =>
        prev.map((p) =>
          p.id === selectedPlan.id
            ? { ...p, stockQuantity: Math.max(0, p.stockQuantity - 1) }
            : p
        )
      )
      setMyPurchases((prev) => ({
        ...prev,
        [selectedPlan.id]: (prev[selectedPlan.id] ?? 0) + 1,
      }))

      alert(data?.message ?? 'Ciclo adquirido com sucesso.')
      setSelectedPlan(null)
    } catch {
      alert('Erro de conexão ao adquirir ciclo.')
    } finally {
      setIsBuying(false)
    }
  }

  const filteredCyclePlans = useMemo(
    () => cyclePlans.filter((plan) => plan.planType === activeCategory),
    [cyclePlans, activeCategory]
  )

  if (!user) return null

  // T0 não pode ver nem comprar planos — mostra mensagem de bloqueio
  const isT0User = userVipLevel === 6

  return (
    <main className="dash-app">
      <section className="dash-main">
        <AppSidebar />

        <div className="dash-content">
          {/* ── Banner topo ── */}
          <div className="cycle-banner-wrap">
            <video autoPlay muted loop playsInline className="cycle-banner-img">
              <source src="https://manceraparfums.com/esp/themes/mancera/assets/img/homepage/bg_video_mochi_musk.mp4" type="video/mp4" />
            </video>
          </div>

          <h2 className="cycle-storage-title">Período de armazenamento</h2>

          {/* ── Bloqueio T0 ── */}
          {isT0User ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#4b5a64' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
              <h3 style={{ color: '#2d3b44', marginBottom: 8 }}>Planos exclusivos para membros T1+</h3>
              <p style={{ fontSize: 14, maxWidth: 320, margin: '0 auto 16px' }}>
                Os planos de ciclo são destinados a membros que já fizeram pelo menos um depósito (T1 em diante).
              </p>
              <p style={{ fontSize: 13, color: '#6b7280' }}>
                Faça um depósito na aba <strong>Depositar</strong> para desbloquear os planos de investimento.
              </p>
              <button
                type="button"
                onClick={() => navigate('/cashin')}
                style={{
                  marginTop: 20,
                  padding: '10px 24px',
                  background: 'linear-gradient(180deg, #0798cb 0%, #0b80b2 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Ir para Depósito
              </button>
            </div>
          ) : (
            <>
              {/* ── Categoria tabs ── */}
              <div className="cycle-category-tabs" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                <button
                  type="button"
                  className={`cycle-category-tab${activeCategory === 'normal' ? ' active' : ''}`}
                  onClick={() => setActiveCategory('normal')}
                >
                  Essencial
                </button>
                <button
                  type="button"
                  className={`cycle-category-tab${activeCategory === 'vip' ? ' active' : ''}`}
                  onClick={() => setActiveCategory('vip')}
                >
                  Fundo de ouro
                </button>
              </div>

              {loading ? (
                <p style={{ color: '#666666', textAlign: 'center', padding: 20 }}>Carregando produtos...</p>
              ) : filteredCyclePlans.length === 0 ? (
                <p style={{ color: '#666666', textAlign: 'center', padding: 20 }}>Nenhum plano disponível nesta categoria.</p>
              ) : (
                <div className="dash-cycle-products-grid">
                  {filteredCyclePlans.map((plan) => {
                    const estoque = Math.max(0, Number(plan.stockQuantity ?? 0))
                    const limitPerUser = Number(plan.maxPurchasesPerUser ?? 0)
                    const userPurchaseCount = Number(myPurchases[plan.id] ?? 0)
                    const limitReached = limitPerUser > 0 && userPurchaseCount >= limitPerUser
                    const isUnavailable = estoque <= 0 || limitReached
                    const effectivePercent = plan.profitPercent > 0 ? plan.profitPercent : plan.profit
                    const totalPercent = Number((effectivePercent * plan.cycleDays).toFixed(2))

                    return (
                      <div
                        key={plan.id}
                        className={`dash-cycle-product-card${isUnavailable ? ' unavailable' : ''}`}
                        onClick={() => { if (!isUnavailable) setSelectedPlan(plan) }}
                        style={isUnavailable ? { opacity: 0.6, pointerEvents: 'none' } : {}}
                      >
                        <div className="dash-cycle-product-image">
                          {plan.imageUrl ? (
                            <img src={plan.imageUrl} alt={plan.name} />
                          ) : (
                            <div className="dash-cycle-product-placeholder">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                              </svg>
                            </div>
                          )}
                                                  </div>
                        <div className="dash-cycle-product-info">
                          <h3 className="dash-cycle-product-name">{plan.name}</h3>
                          <div className="dash-cycle-product-stats">
                            <div className="dash-cycle-stat-item">
                              <span className="dash-cycle-stat-label">Valor do produto</span>
                              <span className="dash-cycle-stat-value">{formatBRL(plan.amount)}</span>
                            </div>
                            <div className="dash-cycle-stat-item">
                              <span className="dash-cycle-stat-label">Renda diária</span>
                              <span className="dash-cycle-stat-value" style={{ color: '#16a34a' }}>
                                {formatBRL(Number((plan.amount * (effectivePercent / 100)).toFixed(2)))}
                              </span>
                            </div>
                            <div className="dash-cycle-stat-item">
                              <span className="dash-cycle-stat-label">Total de dias</span>
                              <span className="dash-cycle-stat-value">{plan.cycleDays} dias</span>
                            </div>
                            <div className="dash-cycle-stat-item">
                              <span className="dash-cycle-stat-label">MANCOIN</span>
                              <span className="dash-cycle-stat-value" style={{ color: '#2563eb' }}>
                                {Number(plan.mancecoinReward ?? 0).toLocaleString('pt-BR')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="dash-cycle-product-buy" onClick={(e) => { e.stopPropagation(); if (!isUnavailable) setSelectedPlan(plan) }}>
                          <span>{isUnavailable ? 'Esgotado' : 'Investir'}</span>
                          {!isUnavailable && (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                              <path d="M9 18l6-6-6-6"/>
                            </svg>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── Modal de investimento ── */}
      {!isT0User && selectedPlan ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
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
              borderRadius: 16,
              padding: 20,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: 0, color: '#2d3b44', fontSize: 18 }}>Confirmar investimento</h3>
            <p style={{ marginTop: 6, color: '#4b5a64', fontSize: 14 }}>{selectedPlan.name}</p>

            {(() => {
              const fixedAmount = selectedPlan.amount
              const modalEffectivePercent = selectedPlan.profitPercent > 0 ? selectedPlan.profitPercent : selectedPlan.profit
              const daily = modalEffectivePercent > 0
                ? Number((fixedAmount * (modalEffectivePercent / 100)).toFixed(2))
                : 0
              const modalTotalReturn = Number((fixedAmount + daily * selectedPlan.cycleDays).toFixed(2))
              return (
                <div style={{ marginTop: 14, display: 'grid', gap: 8, color: '#2f3f49', fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: 'rgba(212, 175, 55, 0.06)', border: '1px solid #d4af37' }}>
                    <span><strong>Valor do produto:</strong></span>
                    <strong style={{ color: '#2d3b44' }}>{formatBRL(fixedAmount)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: 'rgba(212, 175, 55, 0.06)', border: '1px solid #d4af37' }}>
                    <span><strong>Renda diária:</strong></span>
                    <strong style={{ color: '#16a34a' }}>{formatBRL(daily)} <span style={{ fontSize: 11 }}>(após 24h)</span></strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: 'rgba(212, 175, 55, 0.06)', border: '1px solid #d4af37' }}>
                    <span><strong>Retorno total:</strong></span>
                    <strong style={{ color: '#16a34a' }}>{formatBRL(modalTotalReturn)}</strong>
                  </div>
                  <div><strong>Início:</strong> {formatDateTime(new Date())}</div>
                  <div><strong>Fim:</strong> {formatDateTime(new Date(Date.now() + selectedPlan.cycleDays * 24 * 60 * 60 * 1000))}</div>
                  <div><strong>Duração:</strong> {selectedPlan.cycleDays} dias</div>
                  <div><strong>Recompensa MANCOIN:</strong> {Number(selectedPlan.mancecoinReward ?? 0).toLocaleString('pt-BR')}</div>
                  <div style={{
                    marginTop: 6,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: 'rgba(212, 175, 55, 0.12)',
                    border: '1px solid #d4af37',
                    color: '#7a6200',
                    fontSize: 12,
                    fontWeight: 700,
                  }}>
                    A renda diária será creditada automaticamente após cada período de 24h. O investimento total será retornado ao final do ciclo.
                  </div>
                </div>
              )
            })()}

            {(selectedPlan.requireCommissionLevel1Count > 0 || selectedPlan.requireCommissionLevel2Count > 0 || selectedPlan.requireCommissionLevel3Count > 0) ? (
              <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 10, background: 'rgba(212, 175, 55, 0.06)', border: '1px solid #d4af37', fontSize: 13 }}>
                <strong style={{ display: 'block', marginBottom: 6, color: '#2d3b44' }}>Requisitos para se tornar funcionario</strong>
                {selectedPlan.requireCommissionLevel1Count > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    {userInviteCount !== null && userInviteCount.level1 >= selectedPlan.requireCommissionLevel1Count
                      ? <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
                      : <span style={{ color: '#dc2626', fontWeight: 700 }}>✕</span>}
                    <span>
                      Nível 1: {userInviteCount !== null ? `${userInviteCount.level1}/` : ''}{selectedPlan.requireCommissionLevel1Count} indicados com depósito
                    </span>
                  </div>
                ) : null}
                {selectedPlan.requireCommissionLevel2Count > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    {userInviteCount !== null && userInviteCount.level2 >= selectedPlan.requireCommissionLevel2Count
                      ? <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
                      : <span style={{ color: '#dc2626', fontWeight: 700 }}>✕</span>}
                    <span>
                      Nível 2: {userInviteCount !== null ? `${userInviteCount.level2}/` : ''}{selectedPlan.requireCommissionLevel2Count} indicados com depósito
                    </span>
                  </div>
                ) : null}
                {selectedPlan.requireCommissionLevel3Count > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {userInviteCount !== null && userInviteCount.level3 >= selectedPlan.requireCommissionLevel3Count
                      ? <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
                      : <span style={{ color: '#dc2626', fontWeight: 700 }}>✕</span>}
                    <span>
                      Nível 3: {userInviteCount !== null ? `${userInviteCount.level3}/` : ''}{selectedPlan.requireCommissionLevel3Count} indicados com depósito
                    </span>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div style={{ marginTop: 16, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={closePurchaseModal}
                disabled={isBuying}
                style={{
                  border: '1px solid #d4af37',
                  background: '#fff',
                  color: '#4b5a64',
                  borderRadius: 8,
                  padding: '10px 16px',
                  fontWeight: 600,
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
                  border: '1px solid #b8942a',
                  background: 'linear-gradient(135deg, #d4af37, #f7d981)',
                  color: '#3a2e00',
                  borderRadius: 8,
                  padding: '10px 16px',
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