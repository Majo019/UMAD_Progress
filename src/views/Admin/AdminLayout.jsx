import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ListChecks, LogOut, Moon, ShieldCheck, Sun, UserCog, Users } from 'lucide-react';
import { UserAvatar } from '../../components/ui';
import { useAuth, useTheme } from '../../context';
import './admin.css';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { to: '/admin/tareas', label: 'Tareas', icon: ListChecks },
  { to: '/admin/perfil', label: 'Mi perfil', icon: UserCog },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="adm-shell">
      <aside className="adm-sidebar">
        <div className="adm-brand">
          <span className="app-logo" aria-hidden="true">
            <span>U</span>
            <span>P</span>
          </span>
          <div>
            <p className="adm-brand__title">UMAD Progress</p>
            <p className="adm-brand__badge">
              <ShieldCheck size={12} aria-hidden="true" /> Admin
            </p>
          </div>
        </div>

        <nav className="adm-nav" aria-label="Navegación de administración">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `adm-nav__item ${isActive ? 'is-active' : ''}`}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="adm-sidebar__footer">
          <div className="adm-me">
            <UserAvatar name={user?.name || user?.email || 'Admin'} size={36} />
            <div className="adm-me__text">
              <p className="adm-me__name">{user?.name || 'Administrador'}</p>
              <p className="adm-me__email">{user?.email}</p>
            </div>
          </div>
          <div className="adm-sidebar__actions">
            <button type="button" className="icon-btn" onClick={toggleTheme} aria-label="Cambiar tema" title="Cambiar tema">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button type="button" className="icon-btn" onClick={handleLogout} aria-label="Cerrar sesión" title="Cerrar sesión">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      <main className="adm-main">
        <Outlet />
      </main>
    </div>
  );
}

/** Encabezado estándar de cada pantalla del panel. */
export function AdminPageHeader({ title, subtitle, actions }) {
  return (
    <header className="adm-page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="adm-page-header__actions">{actions}</div>}
    </header>
  );
}

export function StatCard({ icon: Icon, label, value, hint, color = 'blue' }) {
  return (
    <div className={`adm-stat adm-stat--${color}`}>
      <div className="adm-stat__icon">
        <Icon size={18} aria-hidden="true" />
      </div>
      <p className="label-mono">{label}</p>
      <p className="adm-stat__value">{value}</p>
      {hint && <p className="adm-stat__hint">{hint}</p>}
    </div>
  );
}

export function RoleBadge({ role }) {
  return role === 'admin' ? (
    <span className="chip chip--coral">
      <ShieldCheck size={12} aria-hidden="true" /> Admin
    </span>
  ) : (
    <span className="chip chip--blue">Usuario</span>
  );
}

export function StatusBadge({ active }) {
  return <span className={`chip ${active ? 'chip--green' : 'chip--neutral'}`}>{active ? 'Activo' : 'Inactivo'}</span>;
}

export function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;
  return (
    <div className="adm-pagination">
      <button type="button" className="btn btn--secondary btn--sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Anterior
      </button>
      <span className="text-muted">
        Página {page} de {pages}
      </span>
      <button type="button" className="btn btn--secondary btn--sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Siguiente
      </button>
    </div>
  );
}
