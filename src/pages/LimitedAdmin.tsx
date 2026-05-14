import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import LimitedAdminSidebar from '../components/LimitedAdminSidebar'
import './Admin.css'

type AdminUser = {
  is_admin?: number
  isAdmin?: number | boolean
}

export default function LimitedAdmin() {
  const navigate = useNavigate()

  const adminUser = useMemo(() => {
    const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')
    if (!raw) return null
    try {
      return JSON.parse(raw) as AdminUser
    } catch {
      return null
    }
  }, [])

  const adminLevel = useMemo(() => {
    if (!adminUser) return 0
    if (typeof adminUser.isAdmin === 'boolean') return adminUser.isAdmin ? 1 : 0
    return Number(adminUser.is_admin ?? adminUser.isAdmin ?? 0)
  }, [adminUser])

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <main className="admin-page">
      <LimitedAdminSidebar />
      <section className="admin-content">
        <header className="admin-header">
          <div>
            <h1>Painel Administrativo</h1>
            <p className="admin-subtitle">
              Área com acesso limitado para operações essenciais.
            </p>
          </div>
          <div className="admin-header-meta">
            <span className="admin-chip">Nível Admin: {adminLevel}</span>
            <span className="admin-chip soft">{today}</span>
          </div>
        </header>

        <section className="admin-grid">
          <article className="admin-panel">
            <div className="admin-panel-head">
              <h2>Ações Disponíveis</h2>
              <span>Acesso restrito</span>
            </div>
            <div className="admin-shortcuts">
              <button type="button" onClick={() => navigate('/athorng/users')}>Usuários</button>
              <button type="button" onClick={() => navigate('/athorng/withdrawals/pending')}>Saques Pendentes</button>
              <button type="button" onClick={() => navigate('/athorng/deposits')}>Depósitos</button>
              <button type="button" onClick={() => navigate('/dashboard')}>Voltar ao App</button>
            </div>
          </article>

          <article className="admin-panel">
            <div className="admin-panel-head">
              <h2>Restrições deste perfil</h2>
              <span>Segurança</span>
            </div>
            <ul className="admin-status-list">
              <li>Sem acesso a configurações globais</li>
              <li>Sem acesso a logs e segurança</li>
              <li>Sem acesso a comissão e integrações</li>
              <li>Sem acesso a branding e parâmetros críticos</li>
            </ul>
          </article>
        </section>
      </section>
    </main>
  )
}
