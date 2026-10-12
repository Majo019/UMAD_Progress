import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  CircleUser,
  House,
  Settings,
  Timer,
  User,
  Users,
} from 'lucide-react';
import './layout.css';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/pomodoro', label: 'Pomodoro', icon: Timer },
  { to: '/calendario', label: 'Calendar', icon: CalendarDays },
  { to: '/amigos', label: 'Friends', icon: Users },
  { to: '/perfil', label: 'Profile', icon: CircleUser },
];

export function AppHeader() {
  const navigate = useNavigate();
  return (
    <header className="app-header">
      <div className="app-header__brand">
        <span className="app-logo" aria-hidden="true">
          <span>U</span>
          <span>P</span>
        </span>
        <span className="app-header__title">UMAD Progress</span>
      </div>
      <div className="app-header__actions">
        <button
          type="button"
          className="icon-btn"
          aria-label="Configuración"
          onClick={() => navigate('/perfil', { state: { openSettings: true } })}
        >
          <Settings size={22} />
        </button>
        <button type="button" className="icon-btn icon-btn--filled" aria-label="Mi perfil" onClick={() => navigate('/perfil')}>
          <User size={18} strokeWidth={2.4} />
        </button>
      </div>
    </header>
  );
}

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => `bottom-nav__item ${isActive ? 'is-active' : ''}`}>
          <Icon size={22} strokeWidth={2} aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default function AppLayout() {
  return (
    <div className="app-shell">
      <AppHeader />
      <main className="app-main">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
