import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { API_URL } from '../utils/apiUrl'

type AdminUser = {
  id?: number
  name?: string
  phone?: string
  is_admin?: number | string
  isAdmin?: number | string | boolean
}

type AdminUsersResponse = {
  ok?: boolean
  users?: Array<{ id?: number; name?: string; phone?: string }>
}

export default function AdminSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
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

  const [usersCount, setUsersCount] = useState<number | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''
    
    const loadUsersCount = async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/users`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const data = (await res.json()) as AdminUsersResponse
        if (!res.ok || !data?.ok || !Array.isArray(data?.users)) {
          setUsersCount(null)
          return
        }
        setUsersCount(data.users.length)
      } catch {
        setUsersCount(null)
      }
    }

    loadUsersCount()
  }, [])

  const usersLabel = usersCount == null ? 'Usuários' : `Usuários (${usersCount})`
  const isLimitedRoute = location.pathname.startsWith('/athorng')

  const normalizeToNumber = (value: unknown) => {
    if (typeof value === 'boolean') return value ? 1 : 0
    const asNumber = Number(value)
    return Number.isFinite(asNumber) ? asNumber : 0
  }

  const adminLevel = Math.max(
    normalizeToNumber(user?.is_admin),
    normalizeToNumber(user?.isAdmin),
  )

  const isAdminLevelTwo = adminLevel === 2
  const isLimitedOnlyView = isLimitedRoute && isAdminLevelTwo

  const basePath = isLimitedRoute ? '/athorng' : '/adf'

  return (
    <>
      <header className="admin-mobile-topbar">
        <button
          type="button"
          className="menu-toggle"
          aria-label="Abrir menu admin"
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
          aria-label="Fechar menu admin"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <aside className={`dash-sidebar admin-dash-sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="dash-brand">
          <div className="brand-logo">A</div>
          <div>
            <strong>Admin Panel</strong>
            <small>{user?.name ?? 'Administrador'}</small>
          </div>
        </div>

        <div className="admin-dash-user-chip">
          <span>{user?.phone ?? '-'}</span>
        </div>

        <nav className="dash-nav">
          <p className="dash-nav-group-title">Visão Geral</p>
          <button type="button" className="dash-nav-item" onClick={() => { navigate(basePath); setMenuOpen(false) }}>
            {isLimitedRoute ? 'Dashboard' : 'Dashboard Admin'}
          </button>

          <p className="dash-nav-group-title">Usuários e Rede</p>
          <button type="button" className="dash-nav-item" onClick={() => { navigate(`${basePath}/users`); setMenuOpen(false) }}>{usersLabel}</button>

          {isLimitedRoute ? (
            <>
              <p className="dash-nav-group-title">VIP</p>
              <button type="button" className="dash-nav-item" onClick={() => { navigate('/athorng/vip-referrals'); setMenuOpen(false) }}>🌟 VIPs que Indicaram</button>
            </>
          ) : null}

          {isLimitedOnlyView ? null : (
            <>
              <button type="button" className="dash-nav-item" onClick={() => { navigate('/adf/rankings'); setMenuOpen(false) }}>Rankings</button>

              <p className="dash-nav-group-title">Saques</p>
              <button type="button" className="dash-nav-item" onClick={() => { navigate('/adf/withdraw-config'); setMenuOpen(false) }}>Configuração de Saque</button>
              <button type="button" className="dash-nav-item" onClick={() => { navigate('/adf/withdrawals/users'); setMenuOpen(false) }}>Saques Usuários</button>
              <button type="button" className="dash-nav-item" onClick={() => { navigate('/adf/withdrawals/pending'); setMenuOpen(false) }}>Saques Pendentes</button>

              <p className="dash-nav-group-title">Depósitos e Comissão</p>
              <button type="button" className="dash-nav-item" onClick={() => { navigate('/adf/deposits'); setMenuOpen(false) }}>Depósitos</button>
              <button type="button" className="dash-nav-item" onClick={() => { navigate('/adf/deposit-config'); setMenuOpen(false) }}>Configuração de Depósitos</button>
              <button type="button" className="dash-nav-item" onClick={() => { navigate('/adf/commission-config'); setMenuOpen(false) }}>Configuração de Comissão</button>
              <button type="button" className="dash-nav-item" onClick={() => { navigate('/adf/monthly-salary'); setMenuOpen(false) }}>Salário Mensal</button>


              <p className="dash-nav-group-title">Promoções</p>
              <button type="button" className="dash-nav-item" onClick={() => { navigate('/adf/gift-codes'); setMenuOpen(false) }}>Gift Codes</button>
              <button type="button" className="dash-nav-item" onClick={() => { navigate('/adf/roulette-code'); setMenuOpen(false) }}>Código da Roleta</button>
              <button type="button" className="dash-nav-item" onClick={() => { navigate('/adf/roulette-probabilities'); setMenuOpen(false) }}>Probabilidades da Roleta</button>
              <button type="button" className="dash-nav-item" onClick={() => { navigate('/adf/caixas-box'); setMenuOpen(false) }}>Caixas Box</button>
              <button type="button" className="dash-nav-item" onClick={() => { navigate('/adf/cycle-products'); setMenuOpen(false) }}>Produtos</button>

              <p className="dash-nav-group-title">Sistema</p>
              <button type="button" className="dash-nav-item" onClick={() => { navigate('/adf/site-settings'); setMenuOpen(false) }}>⚙️ Configurações do Site</button>
              <button type="button" className="dash-nav-item" onClick={() => { navigate('/adf/site-branding'); setMenuOpen(false) }}>Título e Foto do Site</button>
              <button type="button" className="dash-nav-item" onClick={() => { navigate('/adf/telegram-config'); setMenuOpen(false) }}>Bot Telegram</button>
              <button type="button" className="dash-nav-item" onClick={() => { navigate('/adf/community-links'); setMenuOpen(false) }}>Links da Comunidade</button>
              <button type="button" className="dash-nav-item" onClick={() => { navigate('/adf/logs'); setMenuOpen(false) }}>Logs</button>
            </>
          )}
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
