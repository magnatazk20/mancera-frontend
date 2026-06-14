import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './RegistroDoDia.css'
import { API_URL } from '../utils/apiUrl'

interface User {
  id: number
  name: string
  phone: string
}

type RecordStatus = 'paid' | 'pending' | 'processing' | 'failed'

type Transaction = {
  id: number
  amount: number
  method: string
  status: RecordStatus
  type: 'deposit' | 'withdraw'
  createdAt: string | null
}

type EarningsResponse = {
  ok?: boolean
  records?: {
    deposits?: Array<{
      id: number
      amount: number
      status: RecordStatus
      method: string
      createdAt: string | null
      type?: 'deposit'
    }>
    withdrawals?: Array<{
      id: number
      amount: number
      status: RecordStatus
      createdAt: string | null
      type?: 'withdraw'
    }>
  }
}


const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatDateTime = (raw: string | null) => {
  if (!raw) return '-'
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const dateToISO = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

const todayISO = () => dateToISO(new Date())

const STATUS_LABEL: Record<RecordStatus, string> = {
  paid: 'Pago',
  pending: 'Pendente',
  processing: 'Processando',
  failed: 'Falhou',
}

type Filter = 'all' | 'deposit' | 'withdraw'

export default function RegistroDoDia() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  // padrão: últimos 30 dias para não retornar vazio quando o usuário não fez transação hoje
  const initialFrom = useMemo(() => {
    const past = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)
    return dateToISO(past)
  }, [])
  const [from, setFrom] = useState(initialFrom)
  const [to, setTo] = useState(todayISO())
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    const token = localStorage.getItem('token') ?? sessionStorage.getItem('token')
    const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')

    if (!token || !raw) {
      navigate('/')
      return
    }

    try {
      setUser(JSON.parse(raw) as User)
    } catch {
      navigate('/')
    }
  }, [navigate])

  useEffect(() => {
    if (!user?.id) return

    const loadTransactions = async () => {
      setLoading(true)
      setErrorMessage('')
      try {
        const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''
        const response = await fetch(`${API_URL}/api/earnings/records/${user.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!response.ok) {
          setTransactions([])
          setErrorMessage('Não foi possível carregar o histórico.')
          return
        }
        const data = (await response.json()) as EarningsResponse
        if (!data?.ok || !data.records) {
          setTransactions([])
          return
        }

        const deposits: Transaction[] = (data.records.deposits ?? []).map((row) => ({
          id: Number(row.id),
          amount: Number(row.amount ?? 0),
          method: String(row.method ?? 'pix'),
          status: (row.status ?? 'pending') as RecordStatus,
          type: 'deposit',
          createdAt: row.createdAt ?? null,
        }))

        const withdrawals: Transaction[] = (data.records.withdrawals ?? []).map((row) => ({
          id: Number(row.id),
          amount: Number(row.amount ?? 0),
          method: 'pix',
          status: (row.status ?? 'pending') as RecordStatus,
          type: 'withdraw',
          createdAt: row.createdAt ?? null,
        }))

        const merged = [...deposits, ...withdrawals].sort((a, b) => {
          const aT = new Date(String(a.createdAt ?? 0)).getTime()
          const bT = new Date(String(b.createdAt ?? 0)).getTime()
          if (bT !== aT) return bT - aT
          return Number(b.id) - Number(a.id)
        })

        setTransactions(merged)
      } catch {
        setTransactions([])
        setErrorMessage('Erro de conexão ao carregar histórico.')
      } finally {
        setLoading(false)
      }
    }

    loadTransactions()
  }, [user?.id])

  // filtro por data + tipo (client-side)
  const filtered = useMemo(() => {
    const fromTs = from ? new Date(`${from}T00:00:00`).getTime() : null
    const toTs = to ? new Date(`${to}T23:59:59.999`).getTime() : null

    return transactions.filter((t) => {
      if (filter !== 'all' && t.type !== filter) return false
      if (!t.createdAt) return false
      const ts = new Date(t.createdAt).getTime()
      if (Number.isNaN(ts)) return false
      if (fromTs !== null && ts < fromTs) return false
      if (toTs !== null && ts > toTs) return false
      return true
    })
  }, [transactions, filter, from, to])

  const totals = useMemo(() => {
    const totalDeposits = filtered
      .filter((t) => t.type === 'deposit' && t.status === 'paid')
      .reduce((acc, t) => acc + Number(t.amount ?? 0), 0)
    const totalWithdrawals = filtered
      .filter((t) => t.type === 'withdraw' && t.status === 'paid')
      .reduce((acc, t) => acc + Number(t.amount ?? 0), 0)
    return { totalDeposits, totalWithdrawals, count: filtered.length }
  }, [filtered])

  const setQuickRange = (kind: 'today' | '7d' | '30d') => {
    const today = todayISO()
    if (kind === 'today') {
      setFrom(today)
      setTo(today)
      return
    }
    const days = kind === '7d' ? 6 : 29
    const past = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    setFrom(dateToISO(past))
    setTo(today)
  }

  if (!user) return null

  return (
    <main className="rdd-page">
      <header className="rdd-topbar">
        <button
          type="button"
          className="rdd-topbar-back"
          onClick={() => navigate('/profile')}
          aria-label="Voltar"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6l6 6" />
          </svg>
        </button>
        <span className="rdd-topbar-title">Registro do dia</span>
      </header>

      <div className="rdd-scroll-box">
        {/* Resumo */}
        <section className="rdd-section">
          <h3 className="rdd-section-title">Resumo do período</h3>
          <div className="rdd-summary">
            <div className="rdd-summary-item rdd-summary-item--deposit">
              <span className="rdd-summary-label">Depósitos</span>
              <span className="rdd-summary-value">{formatBRL(totals.totalDeposits)}</span>
            </div>
            <div className="rdd-summary-item rdd-summary-item--withdraw">
              <span className="rdd-summary-label">Saques</span>
              <span className="rdd-summary-value">{formatBRL(totals.totalWithdrawals)}</span>
            </div>
            <div className="rdd-summary-item">
              <span className="rdd-summary-label">Transações</span>
              <span className="rdd-summary-value">{totals.count}</span>
            </div>
          </div>
        </section>

        {/* Filtros */}
        <section className="rdd-section">
          <h3 className="rdd-section-title">Filtros</h3>
          <div className="rdd-filter-row">
            <label className="rdd-field">
              <span>De</span>
              <input
                type="date"
                value={from}
                max={to || undefined}
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>
            <label className="rdd-field">
              <span>Até</span>
              <input
                type="date"
                value={to}
                min={from || undefined}
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
          </div>

          <div className="rdd-quick-range">
            <button type="button" onClick={() => setQuickRange('today')}>Hoje</button>
            <button type="button" onClick={() => setQuickRange('7d')}>7 dias</button>
            <button type="button" onClick={() => setQuickRange('30d')}>30 dias</button>
          </div>

          <div className="rdd-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'all'}
              className={`rdd-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Todos
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'deposit'}
              className={`rdd-tab ${filter === 'deposit' ? 'active' : ''}`}
              onClick={() => setFilter('deposit')}
            >
              Depósitos
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'withdraw'}
              className={`rdd-tab ${filter === 'withdraw' ? 'active' : ''}`}
              onClick={() => setFilter('withdraw')}
            >
              Saques
            </button>
          </div>
        </section>

        {/* Lista */}
        <section className="rdd-list" aria-label="Lista de transações">
          {loading ? (
            <div className="rdd-empty">Carregando...</div>
          ) : errorMessage ? (
            <div className="rdd-empty rdd-error">{errorMessage}</div>
          ) : filtered.length === 0 ? (
            <div className="rdd-empty">
              Nenhuma transação encontrada no período selecionado.
            </div>
          ) : (
            filtered.map((t) => {
              const isDeposit = t.type === 'deposit'
              const statusClass = `rdd-status rdd-status--${t.status}`
              return (
                <article
                  key={`${t.type}-${t.id}`}
                  className={`rdd-item ${isDeposit ? 'rdd-item--deposit' : 'rdd-item--withdraw'}`}
                >
                  <div className="rdd-item-icon" aria-hidden="true">
                    {isDeposit ? (
                      <svg viewBox="0 0 24 24">
                        <path
                          d="M12 4v12M7.5 11.5L12 16l4.5-4.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <rect x="4.5" y="18" width="15" height="2.5" rx="1" fill="currentColor" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24">
                        <path
                          d="M12 20V8M7.5 12.5L12 8l4.5 4.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <rect x="4.5" y="3.5" width="15" height="2.5" rx="1" fill="currentColor" />
                      </svg>
                    )}
                  </div>

                  <div className="rdd-item-info">
                    <div className="rdd-item-title-row">
                      <p className="rdd-item-title">
                        {isDeposit ? 'Depósito' : 'Saque'}
                      </p>
                      <span className={statusClass}>{STATUS_LABEL[t.status]}</span>
                    </div>
                    <p className="rdd-item-date">{formatDateTime(t.createdAt)}</p>
                    <p className="rdd-item-tx">ID #{t.id}</p>
                  </div>

                  <div className="rdd-item-amount">
                    <span className={isDeposit ? 'amount-positive' : 'amount-negative'}>
                      {isDeposit ? '+' : '-'} {formatBRL(t.amount)}
                    </span>
                    <span className="rdd-item-method">{(t.method ?? 'pix').toUpperCase()}</span>
                  </div>
                </article>
              )
            })
          )}
        </section>
      </div>
    </main>
  )
}
