import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './AppSidebar.css'

type StoredUser = {
  id: number
  name: string
  phone: string
}

type PaidTransactionResponse = {
  ok?: boolean
  total?: number
  transactions?: Array<{
    type?: 'deposit' | 'withdraw'
    status?: 'paid' | 'pending'
  }>
}

type CommunityLinksResponse = {
  ok?: boolean
  links?: {
    whatsappGroupUrl?: string
    vipGroupUrl?: string
  }
}

type SummaryResponse = {
  balance?: number
  totalDeposits?: number
  monthlySalaryContract?: string | null
}

function SideIcon({
  name,
  className = 'icon-sm',
}: {
  name: 'home' | 'tasks' | 'vjp' | 'invite' | 'user' | 'menu' | 'logout' | 'extract' | 'withdraw' | 'deposit' | 'products'
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
    case 'tasks':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 7h11M8 12h11M8 17h11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="5" cy="7" r="1.2" fill="currentColor" />
          <circle cx="5" cy="12" r="1.2" fill="currentColor" />
          <circle cx="5" cy="17" r="1.2" fill="currentColor" />
        </svg>
      )
    case 'vjp':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
          <path d="M12 4v4M20 12h-4M12 20v-4M4 12h4M17.7 6.3l-2.8 2.8M17.7 17.7l-2.8-2.8M6.3 17.7l2.8-2.8M6.3 6.3l2.8 2.8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
    case 'menu':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'logout':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M14 8l4 4-4 4M18 12H9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'extract':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="3.5" width="16" height="17" rx="2.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8 8h8M8 12h8M8 16h5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      )
    case 'withdraw':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 4v12M7.5 11.5L12 16l4.5-4.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="4.5" y="18" width="15" height="2.5" rx="1" fill="currentColor" />
        </svg>
      )
    case 'deposit':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 20V8M16.5 12.5 12 8l-4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="4.5" y="3.5" width="15" height="2.5" rx="1" fill="currentColor" />
        </svg>
      )
    case 'products':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3.5" y="6.5" width="17" height="11" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8 10h8M8 14h5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )
    default:
      return null
  }
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

export default function AppSidebar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [monthlySalaryContract, setMonthlySalaryContract] = useState('Sem contrato ativo')
  const [canClickVip, setCanClickVip] = useState(false)
  const [vipGroupUrl, setVipGroupUrl] = useState('')

  const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')
  let user: StoredUser | null = null
  if (raw) {
    try {
      user = JSON.parse(raw) as StoredUser
    } catch {
      user = null
    }
  }

  useEffect(() => {
    const loadPaidDepositStatus = async () => {
      if (!user?.id) {
        setCanClickVip(false)
        return
      }

      try {
        const res = await fetch(`${API_URL}/api/transactions/paid/${user.id}?limit=1`)
        if (!res.ok) {
          setCanClickVip(false)
          return
        }

        const data = await res.json() as PaidTransactionResponse
        const hasPaidDeposit = Array.isArray(data?.transactions)
          ? data.transactions.some((tx) => tx?.type === 'deposit' && tx?.status === 'paid')
          : Number(data?.total ?? 0) > 0
        setCanClickVip(hasPaidDeposit)
      } catch {
        setCanClickVip(false)
      }
    }

    loadPaidDepositStatus()
  }, [user?.id])

  useEffect(() => {
    const loadMonthlySalaryContract = async () => {
      if (!user?.id) {
        setMonthlySalaryContract('Sem contrato ativo')
        return
      }

      try {
        const res = await fetch(`${API_URL}/api/user/summary/${user.id}`)
        if (!res.ok) {
          setMonthlySalaryContract('Sem contrato ativo')
          return
        }

        const data = (await res.json()) as SummaryResponse
        const contract = String(data?.monthlySalaryContract ?? '').trim()
        setMonthlySalaryContract(contract || 'Sem contrato ativo')
      } catch {
        setMonthlySalaryContract('Sem contrato ativo')
      }
    }

    loadMonthlySalaryContract()
  }, [user?.id])

  useEffect(() => {
    const loadCommunityLinks = async () => {
      try {
        const res = await fetch(`${API_URL}/api/community-links`)
        if (!res.ok) {
          setVipGroupUrl('')
          return
        }

        const data = await res.json() as CommunityLinksResponse
        const url = String(data?.links?.vipGroupUrl ?? '').trim()
        setVipGroupUrl(url)
      } catch {
        setVipGroupUrl('')
      }
    }

    loadCommunityLinks()
  }, [])

  const openVipGroup = () => {
    if (!canClickVip || !vipGroupUrl) return
    window.open(vipGroupUrl, '_blank', 'noopener,noreferrer')
  }

  const go = (route: string) => {
    navigate(route)
    setMenuOpen(false)
  }

  const isActive = (route: string) => pathname === route

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    setMenuOpen(false)
    navigate('/')
  }

  return (
    <>
      <header className="dash-topbar app-sidebar-topbar">
        <button
          className="menu-toggle"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Abrir menu"
          type="button"
        >
          <SideIcon name="menu" className="icon" />
        </button>

        <div className="app-sidebar-user-row">
          <div className="user-chip app-sidebar-chip">
            <div className="avatar">{(user?.name?.[0] ?? 'U').toUpperCase()}</div>
            <div>
              <strong>{user?.name ?? 'Usuário'}</strong>
              <p>{user?.phone ?? '-'} • Contrato: {monthlySalaryContract}</p>
            </div>
          </div>

          <button
            type="button"
            className="app-sidebar-vip-btn"
            onClick={openVipGroup}
            disabled={!canClickVip || !vipGroupUrl}
            title={
              !canClickVip
                ? 'Disponível apenas para quem tem depósito com status pago'
                : !vipGroupUrl
                  ? 'Link do grupo VIP não configurado'
                  : 'Abrir grupo VIP'
            }
          >
            VIP
          </button>
        </div>
      </header>

      {menuOpen ? (
        <button className="dash-overlay" onClick={() => setMenuOpen(false)} aria-label="Fechar menu" />
      ) : null}

      <aside className={`dash-sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="dash-brand">
          <span className="brand-logo">N</span>
          <div>
            <strong>{user?.name ?? 'Usuário'}</strong>
            <small>{user?.phone ?? '-'} • Contrato: {monthlySalaryContract}</small>
          </div>
        </div>

        <nav className="dash-nav">
          <p className="dash-nav-group-title">Menu</p>
          <button className={`dash-nav-item ${isActive('/dashboard') ? 'active' : ''}`} onClick={() => go('/dashboard')}>
            <SideIcon name="home" className="icon-sm" />
            <span>Início</span>
          </button>
          <button className={`dash-nav-item ${isActive('/cashin') ? 'active' : ''}`} onClick={() => go('/cashin')}>
            <SideIcon name="deposit" className="icon-sm" />
            <span>Depositar</span>
          </button>
          <button className={`dash-nav-item ${isActive('/cycle-products') ? 'active' : ''}`} onClick={() => go('/cycle-products')}>
            <SideIcon name="products" className="icon-sm" />
            <span>Produtos</span>
          </button>
          <button className={`dash-nav-item ${isActive('/invite') ? 'active' : ''}`} onClick={() => go('/invite')}>
            <SideIcon name="invite" className="icon-sm" />
            <span>Convidar</span>
          </button>
          <button className={`dash-nav-item ${isActive('/profile') ? 'active' : ''}`} onClick={() => go('/profile')}>
            <SideIcon name="user" className="icon-sm" />
            <span>Perfil</span>
          </button>
        </nav>

        <button className="dash-logout side" onClick={logout}>
          <SideIcon name="logout" className="icon-sm" />
          <span>Sair da conta</span>
        </button>
      </aside>

      <nav className="dash-bottom-nav">
        <button className={isActive('/dashboard') ? 'active' : ''} onClick={() => go('/dashboard')}>
          <SideIcon name="home" className="icon-sm" />
          <small>Início</small>
        </button>
        <button className={isActive('/cashin') ? 'active' : ''} onClick={() => go('/cashin')}>
          <SideIcon name="deposit" className="icon-sm" />
          <small>Depositar</small>
        </button>
        <button className={isActive('/cycle-products') ? 'active' : ''} onClick={() => go('/cycle-products')}>
          <SideIcon name="products" className="icon-sm" />
          <small>Produtos</small>
        </button>
        <button className={isActive('/invite') ? 'active' : ''} onClick={() => go('/invite')}>
          <SideIcon name="invite" className="icon-sm" />
          <small>Convidar</small>
        </button>
        <button className={isActive('/profile') ? 'active' : ''} onClick={() => go('/profile')}>
          <SideIcon name="user" className="icon-sm" />
          <small>Perfil</small>
        </button>
      </nav>
    </>
  )
}
