import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import './Statement.css'
import { API_URL } from '../utils/apiUrl'

type StoredUser = { id: number; name: string; phone: string }

type SummaryResponse = { balance?: number; totalDeposits?: number }

type MetricsResponse = {
  ok?: boolean
  metrics?: { totalWithdrawals?: number }
}

type Transaction = {
  id: number
  type: 'deposit' | 'withdraw' | 'income' | 'commission'
  title: string
  amount: number
  date: string
}

type TransactionsResponse = {
  ok?: boolean
  transactions?: Transaction[]
  deposits?: Array<{
    id?: number
    amount?: number
    createdAt?: string
    created_at?: string
    paidAt?: string
    paid_at?: string
    status?: string
  }>
}

type CashinHistoryItem = {
  id?: number
  amount?: number
  status?: string
  createdAt?: string
  created_at?: string
  paidAt?: string
  paid_at?: string
}

type CashinHistoryResponse = {
  ok?: boolean
  payments?: CashinHistoryItem[]
  deposits?: CashinHistoryItem[]
  history?: CashinHistoryItem[]
}


const formatBRL = (v: number) =>
  Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

type TabType = 'all' | 'deposit' | 'withdraw' | 'income' | 'commission'

function TxIcon({ type, amount }: { type: Transaction['type']; amount: number }) {
  if (type === 'withdraw' || amount < 0) {
    return (
      <div className="stmt-item-icon withdraw-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </div>
    )
  }
  if (type === 'deposit') {
    return (
      <div className="stmt-item-icon deposit-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </div>
    )
  }
  // income / commission
  return (
    <div className="stmt-item-icon income-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4l3 3" />
      </svg>
    </div>
  )
}

function txLabel(type: Transaction['type']): string {
  if (type === 'deposit') return 'Depósito'
  if (type === 'withdraw') return 'Saque'
  if (type === 'income') return 'Rendimento'
  return 'Comissão'
}

export default function Statement() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState(0)
  const [totalDeposited, setTotalDeposited] = useState(0)
  const [totalWithdrawn, setTotalWithdrawn] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('all')

  const user = (() => {
    const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')
    if (!raw) return null
    try { return JSON.parse(raw) as StoredUser } catch { return null }
  })()

  useEffect(() => {
    if (!user?.id) { navigate('/'); return }

    const load = async () => {
      const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

      try {
        const [summaryRes, metricsRes, txRes] = await Promise.all([
          fetch(`${API_URL}/api/user/summary/${user.id}`, { headers }),
          fetch(`${API_URL}/api/profile/metrics/${user.id}`, { headers }),
          fetch(`${API_URL}/api/transactions/paid/${user.id}`, { headers }),
        ])

        if (summaryRes.ok) {
          const d = (await summaryRes.json()) as SummaryResponse
          setBalance(Number(d.balance ?? 0))
          setTotalDeposited(Number(d.totalDeposits ?? 0))
        }
        if (metricsRes.ok) {
          const d = (await metricsRes.json()) as MetricsResponse
          if (d?.metrics) setTotalWithdrawn(Number(d.metrics.totalWithdrawals ?? 0))
        }
        let normalizedTransactions: Transaction[] = []
        if (txRes.ok) {
          const d = (await txRes.json()) as TransactionsResponse
          if (Array.isArray(d.transactions) && d.transactions.length > 0) {
            normalizedTransactions = d.transactions
          } else if (Array.isArray(d.deposits) && d.deposits.length > 0) {
            normalizedTransactions = d.deposits.map((item, idx) => {
              const amount = Number(item.amount ?? 0)
              const dateRaw = item.paidAt ?? item.paid_at ?? item.createdAt ?? item.created_at ?? new Date().toISOString()
              return {
                id: Number(item.id ?? idx + 1),
                type: amount < 0 ? 'withdraw' : 'deposit',
                title: amount < 0 ? 'Saque' : 'Depósito',
                amount,
                date: new Date(String(dateRaw)).toLocaleString('pt-BR'),
              }
            })
          }
        }

        // Fallback: se endpoint principal não retornar itens, montar histórico de depósitos
        if (normalizedTransactions.length === 0) {
          const fallbackEndpoints = [
            `${API_URL}/api/cashin/history/${user.id}`,
            `${API_URL}/api/cashin/status-history/${user.id}`,
            `${API_URL}/api/cashin/${user.id}/history`,
          ]

          for (const endpoint of fallbackEndpoints) {
            try {
              const cashinRes = await fetch(endpoint, { headers })
              if (!cashinRes.ok) continue

              const cashinData = (await cashinRes.json()) as CashinHistoryResponse
              const list =
                (Array.isArray(cashinData.payments) && cashinData.payments) ||
                (Array.isArray(cashinData.deposits) && cashinData.deposits) ||
                (Array.isArray(cashinData.history) && cashinData.history) ||
                []

              const mapped = list.map((item, idx) => {
                const amount = Number(item.amount ?? 0)
                const dateRaw =
                  item.paidAt ??
                  item.paid_at ??
                  item.createdAt ??
                  item.created_at ??
                  new Date().toISOString()

                const date = new Date(String(dateRaw)).toLocaleString('pt-BR')
                const status = String(item.status ?? '').toLowerCase()
                const isNegative = amount < 0
                const normalizedType: Transaction['type'] = isNegative ? 'withdraw' : 'deposit'
                const title =
                  normalizedType === 'deposit'
                    ? 'Depósito'
                    : status.includes('withdraw')
                      ? 'Saque'
                      : 'Transação'

                return {
                  id: Number(item.id ?? idx + 1),
                  type: normalizedType,
                  title,
                  amount,
                  date,
                }
              })

              if (mapped.length > 0) {
                normalizedTransactions = mapped
                break
              }
            } catch {
              // try next endpoint
            }
          }
        }

        if (normalizedTransactions.length > 0) {
          setTransactions(normalizedTransactions)
        }
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [navigate, user?.id])

  const filtered = transactions.filter(tx => {
    if (activeTab === 'deposit') return tx.type === 'deposit'
    if (activeTab === 'withdraw') return tx.type === 'withdraw'
    if (activeTab === 'income') return tx.type === 'income'
    if (activeTab === 'commission') return tx.type === 'commission'
    return true
  })

  const tabs: { key: TabType; label: string }[] = [
    { key: 'all', label: 'Tudo' },
    { key: 'deposit', label: 'Depósito' },
    { key: 'withdraw', label: 'Saque' },
    { key: 'income', label: 'Rendimento' },
    { key: 'commission', label: 'Comissão' },
  ]

  return (
    <main className="dash-app stmt-page">
      <section className="dash-main">
        <AppSidebar />
        <div className="dash-content">
          <div className="stmt-shell">
            <div className="stmt-top">
              <div className="stmt-header">
                <button type="button" className="stmt-back" onClick={() => navigate('/profile')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <h1 className="stmt-title">Histórico da Carteira</h1>
              </div>

              <div className="stmt-balance">
                <div className="stmt-balance-label">Saldo disponível</div>
                <div className="stmt-balance-value">{formatBRL(balance)}</div>
              </div>

              <div className="stmt-stats">
                <div className="stmt-stat-card">
                  <div className="stmt-stat-icon deposit">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12l7 7 7-7" />
                    </svg>
                  </div>
                  <div className="stmt-stat-info">
                    <span className="stmt-stat-label">Depositado</span>
                    <span className="stmt-stat-value">{formatBRL(totalDeposited)}</span>
                  </div>
                </div>
                <div className="stmt-stat-card">
                  <div className="stmt-stat-icon withdraw">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 19V5M5 12l7-7 7 7" />
                    </svg>
                  </div>
                  <div className="stmt-stat-info">
                    <span className="stmt-stat-label">Sacado</span>
                    <span className="stmt-stat-value">{formatBRL(totalWithdrawn)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="stmt-body">
            <p className="stmt-section-title">Transações</p>

            {/* Tabs */}
            <div className="stmt-tabs">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  className={`stmt-tab ${activeTab === tab.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* List */}
            {loading ? (
              <div className="stmt-loading">
                <div className="stmt-spinner" />
                Carregando...
              </div>
            ) : filtered.length === 0 ? (
              <div className="stmt-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Nenhuma transação encontrada
              </div>
            ) : (
              <div className="stmt-list">
                {filtered.map(tx => {
                  const isPositive = tx.amount >= 0
                  return (
                    <div key={tx.id} className="stmt-item">
                      <div className="stmt-item-left">
                        <TxIcon type={tx.type} amount={tx.amount} />
                        <div className="stmt-item-info">
                          <span className="stmt-item-title">{tx.title}</span>
                          <span className="stmt-item-date">{tx.date}</span>
                        </div>
                      </div>
                      <div className="stmt-item-right">
                        <span className={`stmt-item-amount ${isPositive ? 'positive' : 'negative'}`}>
                          {isPositive ? '+' : ''}{formatBRL(tx.amount)}
                        </span>
                        <span className={`stmt-item-badge ${isPositive ? 'positive' : 'negative'}`}>
                          {txLabel(tx.type)}
                        </span>
                      </div>
                    </div>
                  )
                })}
                <div className="stmt-more">Sem mais dados</div>
              </div>
            )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
