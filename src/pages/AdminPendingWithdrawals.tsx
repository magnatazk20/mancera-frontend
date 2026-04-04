import { useEffect, useMemo, useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import './Admin.css'

type PendingWithdrawal = {
  id: number
  amount: number
  status: string
  createdAt: string | null
  updatedAt: string | null
  paidAt: string | null
  feePercent?: number
  feeAmount?: number
  netAmount?: number
  user: {
    id: number
    name: string
    phone: string
  }
}

type CancelModalState = {
  open: boolean
  withdrawalId: number | null
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('pt-BR')
}

export default function AdminPendingWithdrawals() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')
  const [withdrawals, setWithdrawals] = useState<PendingWithdrawal[]>([])
  const [actingIds, setActingIds] = useState<number[]>([])
  const [cancelModal, setCancelModal] = useState<CancelModalState>({ open: false, withdrawalId: null })
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing'>('all')
  const [minAmountFilter, setMinAmountFilter] = useState('')
  const [maxAmountFilter, setMaxAmountFilter] = useState('')

  const filteredWithdrawals = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    const minValue = Number(String(minAmountFilter).replace(',', '.'))
    const maxValue = Number(String(maxAmountFilter).replace(',', '.'))

    return withdrawals.filter((item) => {
      const matchesTerm = !term
        ? true
        : String(item.user?.name ?? '').toLowerCase().includes(term) ||
          String(item.user?.phone ?? '').toLowerCase().includes(term) ||
          String(item.id).includes(term)

      const normalizedStatus = String(item.status ?? '').toLowerCase()
      const matchesStatus = statusFilter === 'all' ? true : normalizedStatus === statusFilter

      const amount = Number(item.amount ?? 0)
      const matchesMin = !Number.isFinite(minValue) || minAmountFilter === '' ? true : amount >= minValue
      const matchesMax = !Number.isFinite(maxValue) || maxAmountFilter === '' ? true : amount <= maxValue

      return matchesTerm && matchesStatus && matchesMin && matchesMax
    })
  }, [withdrawals, searchTerm, statusFilter, minAmountFilter, maxAmountFilter])

  const pendingCount = useMemo(() => filteredWithdrawals.length, [filteredWithdrawals])

  const fetchPending = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token') ?? sessionStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/admin/withdrawals/pending`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data?.ok) {
        setError(String(data?.error ?? 'Não foi possível carregar os saques pendentes.'))
        setWithdrawals([])
        return
      }

      setWithdrawals(Array.isArray(data.withdrawals) ? data.withdrawals : [])
    } catch {
      setError('Falha de conexão ao carregar saques pendentes.')
      setWithdrawals([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPending()
  }, [])

  const setActing = (withdrawalId: number, value: boolean) => {
    setActingIds((prev) => {
      if (value) return prev.includes(withdrawalId) ? prev : [...prev, withdrawalId]
      return prev.filter((id) => id !== withdrawalId)
    })
  }

  const processAction = async (withdrawalId: number, action: 'approve' | 'cancel', refundOnCancel: boolean) => {
    setActionError('')
    setActionSuccess('')
    setActing(withdrawalId, true)

    try {
      const token = localStorage.getItem('token') ?? sessionStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/admin/withdrawals/${withdrawalId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action, refundOnCancel }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data?.ok) {
        setActionError(String(data?.error ?? 'Não foi possível processar a ação no saque.'))
        return
      }

      setActionSuccess(String(data?.message ?? 'Ação executada com sucesso.'))
      await fetchPending()
    } catch {
      setActionError('Falha de conexão ao processar ação do saque.')
    } finally {
      setActing(withdrawalId, false)
    }
  }

  return (
    <main className="admin-page">
      <AdminSidebar />
      <section className="admin-content admin-users-page">
        <header className="admin-header">
          <div>
            <h1>Saques Pendentes</h1>
            <p className="admin-subtitle">Lista de solicitações de saque aguardando processamento.</p>
          </div>
        </header>

        <section className="admin-panel admin-panel-wide">
          <div className="admin-panel-head">
            <h2>Fila de Saques</h2>
            <span>
              exibindo {pendingCount} de {withdrawals.length}
            </span>
          </div>

          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 12 }}>
            <input
              type="text"
              className="admin-input"
              placeholder="Buscar por telefone, nome ou ID"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />

            <select
              className="admin-input"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'all' | 'pending' | 'processing')}
            >
              <option value="all">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="processing">Processando</option>
            </select>

            <input
              type="text"
              className="admin-input"
              placeholder="Valor mínimo"
              value={minAmountFilter}
              onChange={(event) => setMinAmountFilter(event.target.value)}
            />

            <input
              type="text"
              className="admin-input"
              placeholder="Valor máximo"
              value={maxAmountFilter}
              onChange={(event) => setMaxAmountFilter(event.target.value)}
            />

            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setMinAmountFilter('')
                setMaxAmountFilter('')
              }}
            >
              Limpar filtros
            </button>
          </div>

          {loading ? <p className="admin-log-hint">Carregando saques pendentes...</p> : null}
          {!loading && error ? <p className="admin-log-hint">{error}</p> : null}
          {!loading && !error && withdrawals.length === 0 ? (
            <p className="admin-log-hint">Não há saques pendentes no momento.</p>
          ) : null}
          {!loading && !error && withdrawals.length > 0 && filteredWithdrawals.length === 0 ? (
            <p className="admin-log-hint">Nenhum saque encontrado com os filtros aplicados.</p>
          ) : null}

          {!loading && actionError ? <p className="admin-log-hint">{actionError}</p> : null}
          {!loading && actionSuccess ? <p className="admin-log-hint">{actionSuccess}</p> : null}

          {!loading && !error && filteredWithdrawals.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Usuário</th>
                    <th>Telefone</th>
                    <th>Valor bruto</th>
                    <th>Taxa</th>
                    <th>Valor líquido</th>
                    <th>Status</th>
                    <th>Criado em</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWithdrawals.map((item) => {
                    const isActing = actingIds.includes(item.id)
                    return (
                      <tr key={item.id}>
                        <td>#{item.id}</td>
                        <td>{item.user?.name ?? '-'}</td>
                        <td>{item.user?.phone ?? '-'}</td>
                        <td>{formatBRL(item.amount)}</td>
                        <td>
                          {typeof item.feeAmount === 'number'
                            ? `${formatBRL(item.feeAmount)} (${Number(item.feePercent ?? 0)}%)`
                            : '-'}
                        </td>
                        <td>{typeof item.netAmount === 'number' ? formatBRL(item.netAmount) : '-'}</td>
                        <td>{String(item.status ?? 'pending').toUpperCase()}</td>
                        <td>{formatDate(item.createdAt)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="btn primary"
                              disabled={isActing}
                              onClick={() => processAction(item.id, 'approve', false)}
                            >
                              {isActing ? 'Processando...' : 'Aprovar'}
                            </button>
                            <button
                              type="button"
                              className="btn ghost"
                              disabled={isActing}
                              onClick={() => setCancelModal({ open: true, withdrawalId: item.id })}
                            >
                              Cancelar
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : null}

          {cancelModal.open ? (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: 16,
              }}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: 420,
                  background: '#fff',
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  padding: 16,
                }}
              >
                <h3 style={{ margin: 0, color: '#0f172a' }}>Cancelar saque</h3>
                <p style={{ marginTop: 10, color: '#334155' }}>
                  Deseja estornar o valor para o saldo do usuário?
                </p>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => setCancelModal({ open: false, withdrawalId: null })}
                  >
                    Fechar
                  </button>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={async () => {
                      if (!cancelModal.withdrawalId) return
                      await processAction(cancelModal.withdrawalId, 'cancel', false)
                      setCancelModal({ open: false, withdrawalId: null })
                    }}
                  >
                    Cancelar sem estorno
                  </button>
                  <button
                    type="button"
                    className="btn primary"
                    onClick={async () => {
                      if (!cancelModal.withdrawalId) return
                      await processAction(cancelModal.withdrawalId, 'cancel', true)
                      setCancelModal({ open: false, withdrawalId: null })
                    }}
                  >
                    Cancelar e estornar
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  )
}
