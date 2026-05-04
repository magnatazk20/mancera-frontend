import { useLocation, useNavigate } from 'react-router-dom';
import './AppBottomNav.css';

const navItems = [
  { path: '/dashboard', label: 'Início', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5L12 3l9 7.5"/>
      <path d="M3 19 1.5 16h16l1.5 3H3Z"/>
    </svg>
  ) },
  { path: '/tasks', label: 'Tarefas', icon: '📋' },
  { path: '/profile', label: 'Perfil', icon: '👤' }
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
