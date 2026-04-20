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
        if (!res.ok || !data?.ok || !Array.isArray(data.products)) {
          setProducts([])
          return
        }
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

  const hasRequirements = (p: CycleProduct) =>
    p.requireCommissionLevel1Count > 0 ||
    p.requireCommissionLevel2Count > 0 ||
    p.requireCommissionLevel3Count > 0

  return (
    <main className="tasks-page">
      <AppSidebar />

      <header className="tasks-header">
        <div>
          <p className="tasks-kicker">VIP</p>
          <h1>Regras VIP</h1>
          <span className="tasks-subtitle">Requisitos de convite por produto VIP</span>
        </div>
        <div className="tasks-header-actions">
          <button className="btn ghost" type="button" onClick={() => navigate('/profile')}>
            Voltar
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: 8,
        padding: '0 16px',
        marginBottom: 16,
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('vip')}
          style={{
            flex: 1,
            padding: '10px 0',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 15,
            border: activeTab === 'vip' ? '2px solid #7c3aed' : '1.5px solid #e2e8f0',
            background: activeTab === 'vip' ? 'linear-gradient(135deg,#ede9fe,#ddd6fe)' : '#fff',
            color: activeTab === 'vip' ? '#5b21b6' : '#64748b',
            cursor: 'pointer',
            transition: 'all 150ms',
          }}
        >
          👑 Plano VIP
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('vip_day')}
          style={{
            flex: 1,
            padding: '10px 0',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 15,
            border: activeTab === 'vip_day' ? '2px solid #d97706' : '1.5px solid #e2e8f0',
            background: activeTab === 'vip_day' ? 'linear-gradient(135deg,#fef3c7,#fde68a)' : '#fff',
            color: activeTab === 'vip_day' ? '#92400e' : '#64748b',
            cursor: 'pointer',
            transition: 'all 150ms',
          }}
        >
          ⚡ VIP do Dia
        </button>
      </div>

      {loading ? (
        <div className="vip-inline-message">Carregando produtos...</div>
      ) : filtered.length === 0 ? (
        <div className="vip-inline-message">Nenhum produto VIP disponível nesta categoria.</div>
      ) : (
        <section style={{ padding: '0 16px 32px' }}>
          {/* Cabeçalho explicativo */}
          <div style={{
            background: activeTab === 'vip'
              ? 'linear-gradient(135deg,#ede9fe,#ddd6fe)'
              : 'linear-gradient(135deg,#fef3c7,#fde68a)',
            border: `1.5px solid ${activeTab === 'vip' ? '#c4b5fd' : '#fcd34d'}`,
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 16,
            color: activeTab === 'vip' ? '#4c1d95' : '#78350f',
            fontSize: 14,
            lineHeight: 1.6,
          }}>
            <strong>Como funciona?</strong><br />
            Para comprar um produto VIP, você precisa ter indicados diretos com depósito conforme as regras de cada produto abaixo.
            Os níveis referem-se à profundidade da sua rede de indicações.
          </div>

          {/* Tabela */}
          <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{
                  background: activeTab === 'vip' ? '#7c3aed' : '#d97706',
                  color: '#fff',
                }}>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700 }}>Produto</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 700, whiteSpace: 'nowrap' }}>Montante</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 700, whiteSpace: 'nowrap' }}>Lucro</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 700, whiteSpace: 'nowrap' }}>Ciclo</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 700, whiteSpace: 'nowrap' }}>Nível 1</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 700, whiteSpace: 'nowrap' }}>Nível 2</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 700, whiteSpace: 'nowrap' }}>Nível 3</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product, idx) => (
                  <tr
                    key={product.id}
                    style={{
                      background: idx % 2 === 0 ? '#fff' : '#fafafa',
                      borderBottom: '1px solid #f1f5f9',
                    }}
                  >
                    <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{product.name}</div>
                      {product.description ? (
                        <div style={{ color: '#64748b', fontSize: 12, lineHeight: 1.4 }}>{product.description}</div>
                      ) : null}
                      {product.expiresAt ? (
                        <div style={{ color: '#c2410c', fontSize: 11, marginTop: 2 }}>
                          Expira: {new Date(product.expiresAt).toLocaleString('pt-BR')}
                        </div>
                      ) : null}
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>
                      {formatBRL(product.amount)}
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 700, color: '#16a34a', whiteSpace: 'nowrap' }}>
                      {formatBRL(product.profit)}
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', color: '#334155', whiteSpace: 'nowrap' }}>
                      {product.cycleDays}d
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                      {product.requireCommissionLevel1Count > 0 ? (
                        <span style={{
                          display: 'inline-block',
                          background: '#ede9fe',
                          color: '#5b21b6',
                          fontWeight: 800,
                          borderRadius: 8,
                          padding: '3px 10px',
                          fontSize: 15,
                        }}>
                          {product.requireCommissionLevel1Count}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                      {product.requireCommissionLevel2Count > 0 ? (
                        <span style={{
                          display: 'inline-block',
                          background: '#fef3c7',
                          color: '#92400e',
                          fontWeight: 800,
                          borderRadius: 8,
                          padding: '3px 10px',
                          fontSize: 15,
                        }}>
                          {product.requireCommissionLevel2Count}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                      {product.requireCommissionLevel3Count > 0 ? (
                        <span style={{
                          display: 'inline-block',
                          background: '#dcfce7',
                          color: '#166534',
                          fontWeight: 800,
                          borderRadius: 8,
                          padding: '3px 10px',
                          fontSize: 15,
                        }}>
                          {product.requireCommissionLevel3Count}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legenda */}
          <div style={{
            marginTop: 16,
            padding: '12px 16px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            fontSize: 13,
            color: '#475569',
            lineHeight: 1.7,
          }}>
            <strong style={{ color: '#0f172a' }}>Legenda dos níveis:</strong><br />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 12 }}>
              <span style={{ background: '#ede9fe', color: '#5b21b6', fontWeight: 700, borderRadius: 6, padding: '1px 8px' }}>N1</span>
              Indicados diretos do seu link com depósito
            </span><br />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 12 }}>
              <span style={{ background: '#fef3c7', color: '#92400e', fontWeight: 700, borderRadius: 6, padding: '1px 8px' }}>N2</span>
              Indicados dos seus indicados com depósito
            </span><br />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ background: '#dcfce7', color: '#166534', fontWeight: 700, borderRadius: 6, padding: '1px 8px' }}>N3</span>
              Terceiro nível da sua rede com depósito
            </span>
            <br /><br />
            <strong>—</strong> significa que não há requisito para esse nível.
          </div>

          {/* Produtos sem requisito */}
          {filtered.some((p) => !hasRequirements(p)) ? (
            <div style={{
              marginTop: 14,
              padding: '10px 14px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 10,
              fontSize: 13,
              color: '#166534',
            }}>
              ✅ Produtos sem nenhum requisito de convite podem ser comprados diretamente, respeitando apenas o saldo disponível.
            </div>
          ) : null}
        </section>
      )}
    </main>
  )
}
