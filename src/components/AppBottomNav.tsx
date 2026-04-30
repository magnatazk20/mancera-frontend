import { useLocation, useNavigate } from 'react-router-dom'
import './AppBottomNav.css'

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Início', icon: <path d="M3 10.5L12 3l9 7.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M6 9.5V20h12V9.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>' },
  { path: '/vip', label: 'VIP', icon: <path d="M3 7l4 4 5-6 5 6 4-4-2 11H5L3 7z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="14" r="1.1" fill="currentColor"/>' },
  { path: '/team-report', label: 'Gestão de Equipe', icon: <rect x="3.5" y="6.5" width="17" height="11" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.8"/><path d="M8 10h8M8 14h5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>' },
