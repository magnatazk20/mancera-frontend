import { useLocation, useNavigate } from 'react-router-dom';
import './AppBottomNav.css';

const navItems = [
  { path: '/dashboard', label: 'Início', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M3 10.5L12 3l9 7.5" fill="none"/>
      <path d="M6 9.5V20h12V9.5" fill="none"/>
    </svg>
  ) },
  { path: '/tasks', label: 'Produtos', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="6.5" width="17" height="11" rx="2.5"/>
      <path d="M8 10h8M8 14h5" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ) },
  { path: '/team-expansion', label: 'Equipe', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="6.5" width="17" height="11" rx="2.5"/>
      <circle cx="9" cy="12" r="2.3"/>
      <circle cx="15.5" cy="12" r="1.7" fill="currentColor"/>
    </svg>
  ) },
  { path: '/invite', label: 'Convidar', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ) },
  { path: '/profile', label: 'Perfil', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="8" r="3.2"/>
      <path d="M5 20c.8-3 3.4-5 7-5s6.2 2 7 5"/>
    </svg>
  ) }
];

export default function AppBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="app-bottom-nav">
      {navItems.map((item) => (
        <button
          key={item.path}
          className={location.pathname === item.path ? 'active' : ''}
          onClick={() => navigate(item.path)}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
