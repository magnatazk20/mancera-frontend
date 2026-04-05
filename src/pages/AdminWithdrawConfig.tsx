import { useEffect, useMemo, useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import FloatingToast from '../components/FloatingToast'
import './Admin.css'
import './AdminUsers.css'

type WithdrawConfigResponse = {
  ok?: boolean
  error?: string
  config?: {
    withdrawFeePercent: number
    minWithdrawAmount: number
    maxWithdrawAmount: number
    withdrawAutoApprove?: boolean
  }
  message?: string
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

export default function AdminWithdrawConfig() {
  const token = useMemo(
    () => localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? '',
    []
  )

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [withdrawFeePercent, setWithdrawFeePercent] = useState('')
  const [minWithdrawAmount, setMinWithdrawAmount] = useState('')
  const [maxWithdrawAmount, setMaxWithdrawAmount] = useState('')
  const [withdrawAutoApprove, setWithdrawAutoApprove] = useState(false)

  const loadConfig = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/admin/withdraw-config`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      const data = (await res.json()) as WithdrawConfigResponse
      if (!res.ok || !data?.ok || !data.config) {
        const msg = data?.error ?? 'Falha ao carregar configurações de saque.'
        setToast({ type: 'error', message: msg })
        return
      }

      setWithdrawFeePercent(String(Number(data.config.withdrawFeePercent ?? 0)))
      setMinWithdrawAmount(String(Number(data.config.minWithdrawAmount ?? 0)))
      setMaxWithdrawAmount(String(Number(data.config.maxWithdrawAmount ?? 0)))
      setWithdrawAutoApprove(Boolean(data.config.withdrawAutoApprove))
    } catch {
      const msg = 'Erro de conexão ao carregar configurações.'
      setToast({ type: 'error', message: msg })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConfig()
  }, [])

  const saveConfig = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setToast(null)

    const fee = Number(String(withdrawFeePercent).replace(',', '.'))
    const min = Number(String(minWithdrawAmount).replace(',', '.'))
    const max = Number(String(maxWithdrawAmount).replace(',', '.'))

    if (!Number.isFinite(fee) || fee < 0) {
      const msg = 'Taxa de saque inválida.'
      setToast({ type: 'error', message: msg })
      return
    }

    if (!Number.isFinite(min) || min < 0) {
      const msg = 'Valor mínimo de saque inválido.'
      setToast({ type: 'error', message: msg })
      return
    }

    if (!Number.isFinite(max) || max <= 0) {
      const msg = 'Valor máximo de saque inválido.'
      setToast({ type: 'error', message: msg })
      return
    }

    if (min > max) {
      const msg = 'O valor mínimo não pode ser maior que o valor máximo.'
      setToast({ type: 'error', message: msg })
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`${API_URL}/api/admin/withdraw-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          withdrawFeePercent: fee,
          minWithdrawAmount: min,
          maxWithdrawAmount: max,
          withdrawAutoApprove,
        }),
      })

      const data = (await res.json()) as WithdrawConfigResponse
      if (!res.ok || !data?.ok) {
        const msg = data?.error ?? 'Falha ao salvar configurações.'
        setToast({ type: 'error', message: msg })
        return
      }

      const msg = data?.message ?? 'Configurações salvas com sucesso.'
      setToast({ type: 'success', message: msg })
      await loadConfig()
    } catch {
      const msg = 'Erro de conexão ao salvar configurações.'
      setToast({ type: 'error', message: msg })
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="admin-page">
      <AdminSidebar />
      <section className="admin-content admin-users-page">
        <header className="admin-header">
          <div>
            <h1>Configuração de Saque</h1>
            <p className="admin-subtitle">Defina taxa, limites e se o saque será automático.</p>
          </div>
        </header>

        <section className="admin-panel admin-users-panel">
          {loading ? (
            <p>Carregando configurações...</p>
          ) : (
            <form className="admin-balance-adjust-form" onSubmit={saveConfig}>
              <div className="admin-balance-adjust-grid">
                <label>
                  <span>Taxa de saque (%)</span>
                  <input
                    type="text"
                    value={withdrawFeePercent}
                    onChange={(e) => setWithdrawFeePercent(e.target.value)}
                    inputMode="decimal"
                    placeholder="0"
                  />
                </label>

                <label>
                  <span>Valor mínimo de saque</span>
                  <input
                    type="text"
                    value={minWithdrawAmount}
                    onChange={(e) => setMinWithdrawAmount(e.target.value)}
                    inputMode="decimal"
                    placeholder="0,00"
                  />
                </label>

                <label>
                  <span>Valor máximo de saque</span>
                  <input
                    type="text"
                    value={maxWithdrawAmount}
                    onChange={(e) => setMaxWithdrawAmount(e.target.value)}
                    inputMode="decimal"
                    placeholder="0,00"
                  />
                </label>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
                <input
                  type="checkbox"
                  checked={withdrawAutoApprove}
                  onChange={(e) => setWithdrawAutoApprove(e.target.checked)}
                />
                <span>
                  Permitir saques automáticos (quando ativado, não precisa aprovação em /adf/withdrawals/pending)
                </span>
              </label>

              <button type="submit" className="admin-toggle-logs-btn" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar configurações'}
              </button>
            </form>
          )}
        </section>
      </section>
      <FloatingToast
        open={Boolean(toast?.message)}
        type={toast?.type ?? 'success'}
        message={toast?.message ?? ''}
        onClose={() => setToast(null)}
      />
    </main>
  )
}
