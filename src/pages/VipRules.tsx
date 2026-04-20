import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import './Tasks.css'

type CycleProduct = {
  id: number
  name: string
  description: string
  amount: number
  profit: number
  cycleDays: number
  imageUrl: string
  planType: 'normal' | 'vip' | 'vip_day'
  requireCommissionLevel1Count: number
  requireCommissionLevel2Count: number
  requireCommissionLevel3Count: number
  stockQuantity: number
  expiresAt: string | null
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const normalizePlanType = (value: unknown): 'normal' | 'vip' | 'vip_day' => {
  const raw = String(value ?? '').trim().toLowerCase()
  if (raw === 'vip') return 'vip'
  if (raw === 'vip_day') return 'vip_day'
  return 'normal'
}

// ── Ícones SVG inline ───────────────────────────────────────────────────────
const IconCrown = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20h20M4 20L6 9l6 5l6-9l2 15" />
  </svg>
)
const IconBolt = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L4.5 13.5H12L11 22L19.5 10.5H12L13 2Z" />
  </svg>
)
const IconMoney = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M14.8 9A2 2 0 0 0 13 8h-2a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4h-2a2 2 0 0 1-1.8-1" />
    <path d="M12 7v1M12 16v1" />
  </svg>
)
const IconProfit = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
)
const IconClock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>
)
const IconUsers = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="7" r="3" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M3 19a6 6 0 0 1 12 0" />
    <path d="M14 16a5 5 0 0 1 7 0" />
  </svg>
)
const IconCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="17" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
)
const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12l5 5L20 7" />
  </svg>
)

export default function VipRules() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<CycleProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'vip' | 'vip_day'>('vip')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch(`${API_URL}/api/dashboard/cycle-products`)
        const data = await res.json().catch(() => ({})) as { ok?: boolean; products?: Array<Record<string, unknown>> }
        if (!res.ok || !data?.ok || !Array.isArray(data.products)) { setProducts([]); return }
        const mapped: CycleProduct[] = data.products
          .map((item) => ({
            id: Number(item.id ?? 0),
            name: String(item.name ?? ''),
            description: String(item.description ?? ''),
            amount: Number(item.amount ?? 0),
            profit: Number(item.profit ?? 0),
            cycleDays: Number(item.cycleDays ?? 0),
            imageUrl: String(item.imageUrl ?? ''),
            planType: normalizePlanType(item.planType),
            requireCommissionLevel1Count: Number(item.requireCommissionLevel1Count ?? 0),
            requireCommissionLevel2Count: Number(item.requireCommissionLevel2Count ?? 0),
            requireCommissionLevel3Count: Number(item.requireCommissionLevel3Count ?? 0),
            stockQuantity: Number(item.stockQuantity ?? 0),
            expiresAt: item.expiresAt == null ? null : String(item.expiresAt),
          }))
          .filter((p) => p.planType === 'vip' || p.planType === 'vip_day')
        setProducts(mapped)
      } catch {
        setProducts([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = products.filter((p) => p.planType === activeTab)
  const isVip = activeTab === 'vip'

  const accent     = isVip ? '#7c3aed' : '#d97706'
  const accentLight = isVip ? '#ede9fe' : '#fef3c7'
  const accentText  = isVip ? '#4c1d95' : '#78350f'

  return (
    <main className="tasks-page" style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <AppSidebar />

      <header className="tasks-header">
        <div>
          <p className="tasks-kicker">VIP</p>
          <h1>Regras VIP</h1>
          <span className="tasks-subtitle">Requisitos de convite por produto VIP</span>
        </div>
        <div className="tasks-header-actions">
          <button className="btn ghost" type="button" onClick={() => navigate('/profile')}>Voltar</button>
        </div>
      </header>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 10, padding: '0 16px 16px' }}>
        {(['vip', 'vip_day'] as const).map((tab) => {
          const active = activeTab === tab
          const tabAccent = tab === 'vip' ? '#7c3aed' : '#d97706'
          const tabLight  = tab === 'vip' ? '#ede9fe' : '#fef3c7'
          const tabText   = tab === 'vip' ? '#4c1d95' : '#78350f'
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 0',
                borderRadius: 14,
                fontWeight: 700,
                fontSize: 15,
                border: active ? `2px solid ${tabAccent}` : '1.5px solid #e2e8f0',
                background: active ? tabLight : '#fff',
                color: active ? tabText : '#94a3b8',
                cursor: 'pointer',
                transition: 'all 160ms',
                boxShadow: active ? `0 4px 16px ${tabAccent}33` : 'none',
              }}
            >
              {tab === 'vip' ? <IconCrown /> : <IconBolt />}
              {tab === 'vip' ? 'Plano VIP' : 'VIP do Dia'}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="vip-inline-message">Carregando produtos...</div>
      ) : filtered.length === 0 ? (
        <div className="vip-inline-message">Nenhum produto disponível nesta categoria.</div>
      ) : (
        <div style={{ padding: '0 16px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── Banner explicativo ── */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            padding: '14px 16px',
            borderRadius: 14,
            background: accentLight,
            border: `1.5px solid ${accent}44`,
          }}>
            <span style={{
              flexShrink: 0,
              width: 36,
              height: 36,
              borderRadius: 10,
              background: accent,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {isVip ? <IconCrown /> : <IconBolt />}
            </span>
            <div style={{ fontSize: 13, color: accentText, lineHeight: 1.65 }}>
              <strong style={{ display: 'block', marginBottom: 2 }}>Como funciona?</strong>
              Para adquirir um produto {isVip ? 'VIP' : 'VIP do Dia'}, você precisa ter
              o número mínimo de indicados <strong>com depósito</strong> em cada nível da sua rede,
              conforme exigido pelo produto.
            </div>
          </div>

          {/* ── Cards dos produtos ── */}
          {filtered.map((product) => {
            const hasLvl1 = product.requireCommissionLevel1Count > 0
            const hasLvl2 = product.requireCommissionLevel2Count > 0
            const hasLvl3 = product.requireCommissionLevel3Count > 0
            const hasAny  = hasLvl1 || hasLvl2 || hasLvl3
            const parsedExpires = product.expiresAt ? new Date(product.expiresAt) : null
            const expiresValid  = parsedExpires && !Number.isNaN(parsedExpires.getTime())

            return (
              <div
                key={product.id}
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  overflow: 'hidden',
                  boxShadow: '0 2px 12px rgba(15,23,42,.07)',
                  border: '1px solid #f1f5f9',
                }}
              >
                {/* cabeçalho colorido */}
                <div style={{
                  background: isVip
                    ? 'linear-gradient(120deg,#7c3aed,#a855f7)'
                    : 'linear-gradient(120deg,#d97706,#f59e0b)',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0, background: '#fff3' }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  ) : (
                    <span style={{
                      width: 44, height: 44, borderRadius: 10,
                      background: '#fff3',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', flexShrink: 0,
                    }}>
                      {isVip ? <IconCrown /> : <IconBolt />}
                    </span>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: '#fff', lineHeight: 1.2 }}>{product.name}</div>
                    {product.description ? (
                      <div style={{ fontSize: 12, color: '#ffffffcc', marginTop: 2, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {product.description}
                      </div>
                    ) : null}
                  </div>
                  {!hasAny ? (
                    <span style={{
                      flexShrink: 0,
                      background: '#fff',
                      color: '#16a34a',
                      fontWeight: 700,
                      fontSize: 11,
                      borderRadius: 20,
                      padding: '3px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}>
                      <IconCheck /> Livre
                    </span>
                  ) : null}
                </div>

                {/* corpo */}
                <div style={{ padding: '14px 16px' }}>

                  {/* métricas */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 8,
                    marginBottom: 14,
                  }}>
                    {[
                      { icon: <IconMoney />, label: 'Montante', value: formatBRL(product.amount), color: '#0f172a' },
                      { icon: <IconProfit />, label: 'Lucro', value: formatBRL(product.profit), color: '#16a34a' },
                      { icon: <IconClock />, label: 'Ciclo', value: `${product.cycleDays}d`, color: '#2563eb' },
                    ].map(({ icon, label, value, color }) => (
                      <div
                        key={label}
                        style={{
                          background: '#f8fafc',
                          borderRadius: 10,
                          padding: '10px 8px',
                          textAlign: 'center',
                          border: '1px solid #f1f5f9',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#64748b', marginBottom: 4 }}>
                          {icon}
                          <span style={{ fontSize: 11 }}>{label}</span>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: 14, color }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* expiração */}
                  {expiresValid && parsedExpires ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '7px 10px',
                      borderRadius: 8,
                      background: '#fff7ed',
                      border: '1px solid #fed7aa',
                      color: '#c2410c',
                      fontSize: 12,
                      fontWeight: 600,
                      marginBottom: 12,
                    }}>
                      <IconCalendar />
                      Expira em: {parsedExpires.toLocaleString('pt-BR')}
                    </div>
                  ) : null}

                  {/* requisitos de convite */}
                  {hasAny ? (
                    <div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        marginBottom: 10,
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#475569',
                      }}>
                        <IconUsers />
                        Indicados com depósito exigidos
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[
                          { level: 1, count: product.requireCommissionLevel1Count, show: hasLvl1, bg: '#ede9fe', border: '#c4b5fd', color: '#5b21b6', label: 'Nível 1 — Diretos', sub: 'Indicados diretos do seu link' },
                          { level: 2, count: product.requireCommissionLevel2Count, show: hasLvl2, bg: '#fef3c7', border: '#fde68a', color: '#92400e', label: 'Nível 2 — Indiretos', sub: 'Indicados dos seus indicados' },
                          { level: 3, count: product.requireCommissionLevel3Count, show: hasLvl3, bg: '#dcfce7', border: '#bbf7d0', color: '#166534', label: 'Nível 3 — Rede profunda', sub: 'Terceiro grau da sua rede' },
                        ].filter((r) => r.show).map((row) => (
                          <div
                            key={row.level}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              padding: '10px 12px',
                              borderRadius: 10,
                              background: row.bg,
                              border: `1.5px solid ${row.border}`,
                            }}
                          >
                            {/* badge nível */}
                            <span style={{
                              flexShrink: 0,
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: row.color,
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 900,
                              fontSize: 14,
                            }}>
                              N{row.level}
                            </span>
                            {/* texto */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: 13, color: row.color }}>{row.label}</div>
                              <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{row.sub}</div>
                            </div>
                            {/* quantidade */}
                            <span style={{
                              flexShrink: 0,
                              minWidth: 36,
                              textAlign: 'center',
                              fontWeight: 900,
                              fontSize: 22,
                              color: row.color,
                              lineHeight: 1,
                            }}>
                              {row.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: '#f0fdf4',
                      border: '1.5px solid #bbf7d0',
                      color: '#15803d',
                      fontSize: 13,
                      fontWeight: 600,
                    }}>
                      <span style={{ color: '#16a34a' }}><IconCheck /></span>
                      Sem requisito de convite — basta ter saldo suficiente.
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* ── Legenda ── */}
          <div style={{
            background: '#fff',
            borderRadius: 14,
            border: '1px solid #e2e8f0',
            padding: '14px 16px',
          }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconUsers /> Legenda dos níveis
            </div>
            {[
              { bg: '#ede9fe', border: '#c4b5fd', color: '#5b21b6', label: 'N1', desc: 'Quem você convidou diretamente pelo seu link e fez depósito' },
              { bg: '#fef3c7', border: '#fde68a', color: '#92400e', label: 'N2', desc: 'Quem os seus indicados convidaram e fizeram depósito' },
              { bg: '#dcfce7', border: '#bbf7d0', color: '#166534', label: 'N3', desc: 'Terceiro grau da rede — indicados dos indicados dos seus indicados' },
            ].map((row) => (
              <div key={row.label} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 8,
              }}>
                <span style={{
                  flexShrink: 0,
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: row.bg,
                  border: `1.5px solid ${row.border}`,
                  color: row.color,
                  fontWeight: 800,
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {row.label}
                </span>
                <span style={{ fontSize: 12, color: '#475569', lineHeight: 1.4 }}>{row.desc}</span>
              </div>
            ))}
          </div>

        </div>
      )}
    </main>
  )
}
