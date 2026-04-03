import AdminSidebar from '../components/AdminSidebar'
import './Admin.css'

export default function AdminPendingWithdrawals() {
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
            <span>Pendente de integração completa</span>
          </div>
          <p className="admin-log-hint">
            Em breve esta tela exibirá os saques pendentes com ações administrativas.
          </p>
        </section>
      </section>
    </main>
  )
}
