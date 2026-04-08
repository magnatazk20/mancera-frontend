import { useLocation, useNavigate } from 'react-router-dom'
import './AppBottomNav.css'

function NavIcon({
  name,
  className = 'icon-sm',
}: {
  name: 'home' | 'deposit' | 'products' | 'invite' | 'user'
  className?: string
}) {
  switch (name) {
    case 'home':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 10.5L12 3l9 7.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M6 9.5V20h12V9.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'deposit':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 4v16M6 10h12M6 15h12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <rect x="3.5" y="5" width="17" height="14" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      )
    case 'products':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3.5" y="6.5" width="17" height="11" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8 10h8M8 14h5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )
    case 'invite':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3.5" y="6.5" width="17" height="11" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="9" cy="12" r="2.3" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="15.5" cy="12" r="1.7" fill="currentColor" />
        </svg>
      )
    case 'user':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="8" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M5 20c.8-3 3.4-5 7-5s6.2 2 7 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    default:
      return null
  }
}

export default function AppBottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const isActive = (route: string) => pathname === route

  return (
    <nav className="app-bottom-nav">
      <button className={isActive('/dashboard') ? 'active' : ''} onClick={() => navigate('/dashboard')}>
        <NavIcon name="home" />
        <small>Início</small>
      </button>
      <button className={isActive('/cashin') ? 'active' : ''} onClick={() => navigate('/cashin')}>
        <NavIcon name="deposit" />
        <small>Depositar</small>
      </button>
      <button className={isActive('/gift-vouchers') ? 'active' : ''} onClick={() => navigate('/gift-vouchers')}>
        <NavIcon name="products" />
        <small>Produtos</small>
      </button>
      <button className={isActive('/invite') ? 'active' : ''} onClick={() => navigate('/invite')}>
        <NavIcon name="invite" />
        <small>Convidar</small>
      </button>
      <button className={isActive('/profile') ? 'active' : ''} onClick={() => navigate('/profile')}>
        <NavIcon name="user" />
        <small>Perfil</small>
      </button>
    </nav>
  )
}
