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
  user: {
    id: number
    name: string
    phone: string
  }
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
  const [withdrawals, setWithdrawals] = useState<PendingWithdrawal[]>([])

  const pendingCount = useMemo(() => withdrawals.length, [withdrawals])

  useEffect(() => {
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

    fetchPending()
  }, [])

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
            <span>{pendingCount} pendente(s)</span>
          </div>

          {loading ? <p className="admin-log-hint">Carregando saques pendentes...</p> : null}
          {!loading && error ? <p className="admin-log-hint">{error}</p> : null}
          {!loading && !error && withdrawals.length === 0 ? (
            <p className="admin-log-hint">Não há saques pendentes no momento.</p>
          ) : null}

          {!loading && !error && withdrawals.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Usuário</th>
                    <th>Telefone</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Criado em</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((item) => (
                    <tr key={item.id}>
                      <td>#{item.id}</td>
                      <td>{item.user?.name ?? '-'}</td>
                      <td>{item.user?.phone ?? '-'}</td>
                      <td>{formatBRL(item.amount)}</td>
                      <td>{String(item.status ?? 'pending').toUpperCase()}</td>
                      <td>{formatDate(item.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  )
}
