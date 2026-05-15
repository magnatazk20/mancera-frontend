import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

type AdminUser = {
  name?: string
  phone?: string
}

export default function LimitedAdminSidebar() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const user = useMemo(() => {
    const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')
    if (!raw) return null
    try {
      return JSON.parse(raw) as AdminUser
    } catch {
      return null
    }
  }, [])

  return (
    <>
      <header className="admin-mobile-topbar">
        <button
          type="button"
          className="menu-toggle"
          aria-label="Abrir menu admin limitado"
          onClick={() => setMenuOpen(true)}
        >
          ☰
        </button>
        <div className="admin-mobile-user">
          <strong>Admin</strong>
          <small>{user?.name ?? 'Administrador'}</small>
        </div>
      </header>

      {menuOpen ? (
        <button
          type="button"
          className="dash-overlay"
          aria-label="Fechar menu admin limitado"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <aside className={`dash-sidebar admin-dash-sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="dash-brand">
          <div className="brand-logo">A</div>
          <div>
            <strong>Admin Limitado</strong>
            <small>{user?.name ?? 'Administrador'}</small>
          </div>
        </div>

        <div className="admin-dash-user-chip">
          <span>{user?.phone ?? '-'}</span>
        </div>

        <nav className="dash-nav">
          <p className="dash-nav-group-title">Painel</p>
          <button type="button" className="dash-nav-item" onClick={() => { navigate('/athorng'); setMenuOpen(false) }}>Dashboard</button>

          <p className="dash-nav-group-title">Operações Permitidas</p>
          <button type="button" className="dash-nav-item" onClick={() => { navigate('/athorng/users'); setMenuOpen(false) }}>Usuários</button>

          <p className="dash-nav-group-title">VIP</p>
          <button type="button" className="dash-nav-item" onClick={() => { navigate('/athorng/vip-referrals'); setMenuOpen(false) }}>🌟 VIPs que Indicaram</button>
        </nav>

        <button
          type="button"
          className="dash-logout side"
          onClick={() => {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            sessionStorage.removeItem('token')
            sessionStorage.removeItem('user')
            navigate('/')
          }}
        >
          Sair
        </button>
      </aside>
    </>
  )
}
