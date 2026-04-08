import { useLocation, useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import './Tasks.css'
import './WithdrawReceipt.css'

type ReceiptState = {
  amount: number
  requestedAt: string
  receiptCode?: string | null
  externalId?: string | null
}

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function WithdrawReceipt() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state ?? null) as ReceiptState | null

  if (!state) {
    return (
      <main className="tasks-page withdraw-receipt-page">
        <AppSidebar />
        <section className="withdraw-receipt-empty">
          <h2>Comprovante indisponível</h2>
          <p>Não foi encontrado nenhum comprovante para exibir.</p>
          <button type="button" className="btn primary" onClick={() => navigate('/withdraw')}>
            Voltar para Saque
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="tasks-page withdraw-receipt-page">
      <AppSidebar />

      <header className="tasks-header">
        <div>
          <p className="tasks-kicker">Financeiro</p>
          <h1>Comprovante</h1>
          <span className="tasks-subtitle">Comprovante da sua solicitação de saque</span>
        </div>
        <div className="tasks-header-actions">
          <button className="btn ghost" type="button" onClick={() => navigate('/withdraw')}>
            Voltar
          </button>
        </div>
      </header>

      <section className="withdraw-paper-receipt" aria-label="Comprovante de solicitação de saque">
        <header className="withdraw-paper-header">
          <div>
            <h3>PGLM</h3>
            <p>Comprovante de Solicitação de Saque</p>
          </div>
          <span className="withdraw-paper-badge">VIA DO CLIENTE</span>
        </header>

        <div className="withdraw-paper-cut" />

        <div className="withdraw-paper-body">
          <p className="withdraw-paper-success">Solicitação de saque enviada com sucesso.</p>

          <div className="withdraw-paper-row">
            <span>Situação</span>
            <strong>Solicitação recebida com sucesso</strong>
          </div>

          <div className="withdraw-paper-row">
            <span>Valor solicitado</span>
            <strong>{formatBRL(state.amount)}</strong>
          </div>

          <div className="withdraw-paper-row">
            <span>Data e hora</span>
            <strong>{new Date(state.requestedAt).toLocaleString('pt-BR')}</strong>
          </div>

          <div className="withdraw-paper-row">
            <span>Comprovante</span>
            <strong>{state.receiptCode ?? state.externalId ?? '-'}</strong>
          </div>

          <div className="withdraw-paper-row">
            <span>CNPJ PGLM</span>
            <strong>12.345.678/0001-99</strong>
          </div>
        </div>

        <footer className="withdraw-paper-footer">
          <small>Documento gerado automaticamente pelo sistema PGLM.</small>
        </footer>
      </section>
    </main>
  )
}
