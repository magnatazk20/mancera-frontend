import { useEffect, useMemo, useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import './Admin.css'

type AdminWithdrawalRow = {
  id: number
  amount: number
  status: string
  createdAt?: string | null
  paidAt?: string | null
  user: {
    id: number
    name: string
    phone: string
  }
}

type ApiResponse = {
  ok?: boolean
  error?: string
  withdrawals?: AdminWithdrawalRow[]
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatDateTime = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('pt-BR')
}

const isNonPendingStatus = (status: string) => {
  const normalized = String(status ?? '').toLowerCase().trim()
  return normalized !== 'pending'
}

const mapStatusClass = (status: string) => {
  const normalized = String(status ?? '').toLowerCase().trim()
  if (normalized === 'paid' || normalized === 'payment.paid') return 'paid'
  if (normalized === 'processing') return 'pending'
  if (normalized === 'failed' || normalized === 'canceled' || normalized === 'cancelled') return 'danger'
  return 'pending'
}

const mapStatusLabel = (status: string) => {
  const normalized = String(status ?? '').toLowerCase().trim()
  if (normalized === 'paid' || normalized === 'payment.paid') return 'Pago'
  if (normalized === 'processing') return 'Processando'
  if (normalized === 'failed') return 'Falhou'
  if (normalized === 'canceled' || normalized === 'cancelled') return 'Cancelado'
  return String(status ?? '-').toUpperCase()
}

export default function AdminUserWithdrawals() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rows, setRows] = useState<AdminWithdrawalRow[]>([])

  const token = useMemo(
    () => localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? '',
    []
  )

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')

      try {
        const res = await fetch(`${API_URL}/api/admin/withdrawals/latest?limit=200`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

        const data = (await res.json()) as ApiResponse
        if (!res.ok || !data?.ok) {
          setError(data?.error ?? 'Falha ao carregar saques dos usuários.')
          setRows([])
          return
        }

        const allRows = Array.isArray(data.withdrawals) ? data.withdrawals : []
        const nonPending = allRows.filter((item) => isNonPendingStatus(item.status))
        setRows(nonPending)
      } catch {
        setError('Erro de conexão ao carregar saques dos usuários.')
        setRows([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [token])

  return (
    <main className="admin-page">
      <AdminSidebar />
      <section className="admin-content admin-users-page">
        <header className="admin-header">
          <div>
            <h1>Saques Usuários</h1>
            <p className="admin-subtitle">Histórico de saques dos usuários (exceto pendentes).</p>
          </div>
        </header>

        <section className="admin-panel admin-panel-wide">
          <div className="admin-panel-head">
            <h2>Saques (Não Pendentes)</h2>
            <span>Total: {rows.length}</span>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Usuário</th>
                  <th>Telefone</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6}>Carregando saques...</td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6}>{error}</td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6}>Nenhum saque não pendente encontrado.</td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td>#{row.id}</td>
                      <td>{row.user?.name || `Usuário #${row.user?.id ?? ''}`}</td>
                      <td>{row.user?.phone || '-'}</td>
                      <td>{formatBRL(row.amount)}</td>
                      <td>
                        <span className={`status ${mapStatusClass(row.status)}`}>{mapStatusLabel(row.status)}</span>
                      </td>
                      <td>{formatDateTime(row.paidAt ?? row.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="admin-withdraw-cards">
            {loading ? (
              <p>Carregando saques...</p>
            ) : error ? (
              <p>{error}</p>
            ) : rows.length === 0 ? (
              <p>Nenhum saque não pendente encontrado.</p>
            ) : (
              rows.map((row) => (
                <div key={row.id} className="admin-withdraw-card">
                  <div className="admin-withdraw-row">
                    <strong>ID</strong>
                    <span>#{row.id}</span>
                  </div>
                  <div className="admin-withdraw-row">
                    <strong>Usuário</strong>
                    <span>{row.user?.name || `Usuário #${row.user?.id ?? ''}`}</span>
                  </div>
                  <div className="admin-withdraw-row">
                    <strong>Telefone</strong>
                    <span>{row.user?.phone || '-'}</span>
                  </div>
                  <div className="admin-withdraw-row">
                    <strong>Valor</strong>
                    <span>{formatBRL(row.amount)}</span>
                  </div>
                  <div className="admin-withdraw-row">
                    <strong>Status</strong>
                    <span className={`status ${mapStatusClass(row.status)}`}>{mapStatusLabel(row.status)}</span>
                  </div>
                  <div className="admin-withdraw-row">
                    <strong>Data</strong>
                    <span>{formatDateTime(row.paidAt ?? row.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  )
}
