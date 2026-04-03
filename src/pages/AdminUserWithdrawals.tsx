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

const isApprovedStatus = (status: string) => {
  const normalized = String(status ?? '').toLowerCase()
  return normalized === 'paid' || normalized === 'payment.paid'
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
        const approved = allRows.filter((item) => isApprovedStatus(item.status))
        setRows(approved)
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
            <p className="admin-subtitle">Histórico de saques aprovados dos usuários.</p>
          </div>
        </header>

        <section className="admin-panel admin-panel-wide">
          <div className="admin-panel-head">
            <h2>Saques Aprovados</h2>
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
                    <td colSpan={6}>Carregando saques aprovados...</td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6}>{error}</td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6}>Nenhum saque aprovado encontrado.</td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td>#{row.id}</td>
                      <td>{row.user?.name || `Usuário #${row.user?.id ?? ''}`}</td>
                      <td>{row.user?.phone || '-'}</td>
                      <td>{formatBRL(row.amount)}</td>
                      <td>
                        <span className="status paid">Pago</span>
                      </td>
                      <td>{formatDateTime(row.paidAt ?? row.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  )
}
