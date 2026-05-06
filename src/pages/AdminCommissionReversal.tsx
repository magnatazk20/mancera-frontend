import { useEffect, useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import './Admin.css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

type ReversalResponse = {
  ok?: boolean
  message?: string
  revertedTasks?: number
  revertedDeposits?: number
  totalReverted?: number
  error?: string
}

type T0UserInfo = {
  userId: number
  name: string | null
  phone: string | null
}

export default function AdminCommissionReversal() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ReversalResponse | null>(null)
  const [t0Users, setT0Users] = useState<T0UserInfo[]>([])
  const [confirmText, setConfirmText] = useState('')
  const [step, setStep] = useState<'info' | 'confirm' | 'done'>('info')

  useEffect(() => {
    const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''
    fetch(`${API_URL}/api/admin/commission-reversal-preview`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok && Array.isArray(d?.t0Users)) setT0Users(d.t0Users)
      })
      .catch(() => null)
  }, [])

  const handleRevert = async () => {
    if (confirmText !== 'REVERTIR') return
    setLoading(true)
    try {
      const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''
      const res = await fetch(`${API_URL}/api/admin/commission-reversal`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      const data = (await res.json()) as ReversalResponse
      setResult(data)
      setStep('done')
    } catch {
      setResult({ ok: false, error: 'Erro de conexão.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="admin-page">
      <AdminSidebar />
      <section className="admin-content admin-users-page">
        <header className="admin-header">
          <div>
            <h1>🔄 Estorno de Comissões (T0-Estágio)</h1>
            <p className="admin-subtitle">
              Identifica e estorna todas as comissões geradas por usuários T0-Estágio (estagiários),
              descontando o valor do commission_balance dos uplines que receberam indevidamente.
            </p>
          </div>
        </header>

        {/* Info panel */}
        <section className="admin-panel">
          <div className="admin-panel-head">
            <h2>Usuários T0-Estágio encontrados</h2>
            <span>{t0Users.length} usuário(s)</span>
          </div>
          {t0Users.length === 0 ? (
            <p style={{ padding: '1rem', color: 'var(--text-muted, #888)' }}>Nenhum usuário T0-Estágio encontrado.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nome</th>
                    <th>Telefone</th>
                  </tr>
                </thead>
                <tbody>
                  {t0Users.map((u) => (
                    <tr key={u.userId}>
                      <td>#{u.userId}</td>
                      <td>{u.name ?? '-'}</td>
                      <td>{u.phone ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Warning panel */}
        <section className="admin-panel" style={{ border: '1px solid #f87171', background: 'rgba(248,113,113,0.05)' }}>
          <div className="admin-panel-head">
            <h2 style={{ color: '#f87171' }}>⚠️ Atenção — Ação Irreversível</h2>
          </div>
          <ul style={{ padding: '0.5rem 1rem 1rem 1.5rem', color: 'var(--text-muted, #aaa)', lineHeight: 1.8 }}>
            <li>Este estorno vai <strong style={{ color: '#fff' }}>descontar</strong> o valor das comissões do <strong style={{ color: '#fff' }}>commission_balance</strong> dos uplines que receberam.</li>
            <li>Osuplines afetados podem ter seu saldo de comissão <strong style={{ color: '#fff' }}>negativado</strong> caso não tenham saldo suficiente.</li>
            <li>Logs de estorno serão gravados na tabela <strong style={{ color: '#fff' }}>logs</strong> com ação <code>commission_reversal</code>.</li>
            <li>Esta ação <strong style={{ color: '#f87171' }}>não pode ser desfeita</strong>.</li>
          </ul>

          {step === 'info' && (
            <div style={{ padding: '1rem' }}>
              <button
                type="button"
                className="admin-btn primary"
                style={{ background: '#f87171', fontSize: '1rem', padding: '0.75rem 2rem' }}
                onClick={() => setStep('confirm')}
              >
                Continuar para Confirmação
              </button>
            </div>
          )}
        </section>

        {/* Confirm panel */}
        {step === 'confirm' && (
          <section className="admin-panel">
            <div className="admin-panel-head">
              <h2>Confirme para executar o estorno</h2>
            </div>
            <div className="admin-balance-adjust-grid">
              <label>
                Digite <strong style={{ color: '#f87171' }}>REVERTIR</strong> para confirmar:
                <input
                  className="admin-users-input"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                  placeholder="REVERTIR"
                  style={{ borderColor: confirmText === 'REVERTIR' ? '#4ade80' : '#f87171' }}
                />
              </label>
            </div>
            <div style={{ padding: '1rem', display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                className="admin-btn"
                style={{ background: '#444' }}
                onClick={() => setStep('info')}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="admin-btn primary"
                style={{ background: '#f87171' }}
                onClick={handleRevert}
                disabled={loading || confirmText !== 'REVERTIR'}
              >
                {loading ? 'Executando estorno...' : 'Executar Estorno'}
              </button>
            </div>
          </section>
        )}

        {/* Result panel */}
        {step === 'done' && result && (
          <section className="admin-panel">
            <div className="admin-panel-head">
              <h2 style={{ color: result.ok ? '#4ade80' : '#f87171' }}>
                {result.ok ? '✅ Estorno executado' : '❌ Erro no estorno'}
              </h2>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <tbody>
                  <tr>
                    <td><strong>Mensagem</strong></td>
                    <td>{result.message ?? '-'}</td>
                  </tr>
                  <tr>
                    <td><strong>Comissões de tarefas revertidas</strong></td>
                    <td>{result.revertedTasks ?? 0}</td>
                  </tr>
                  <tr>
                    <td><strong>Comissões de depósitos revertidas</strong></td>
                    <td>{result.revertedDeposits ?? 0}</td>
                  </tr>
                  <tr>
                    <td><strong>Total revertido (R$)</strong></td>
                    <td style={{ color: '#f87171', fontWeight: 'bold' }}>
                      {result.totalReverted != null
                        ? Number(result.totalReverted).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        : '-'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}
      </section>
    </main>
  )
}