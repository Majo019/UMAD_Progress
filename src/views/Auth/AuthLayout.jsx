import { Link } from 'react-router-dom';
import './Auth.css';

/**
 * Layout común para Login / Register / Forgot / Reset.
 * Mobile-first, alineado al ancho máximo de la app (560px).
 */
export default function AuthLayout({ title, subtitle, children, footer, onBack }) {
  return (
    <main className="auth">
      <div className="auth__glow" aria-hidden="true" />

      <header className="auth__header">
        {onBack && (
          <button
            type="button"
            className="auth__back"
            onClick={onBack}
            aria-label="Volver"
          >
            ←
          </button>
        )}
        <Link to="/login" className="auth__brand" aria-label="UMAD Progress, inicio">
          <span className="auth__logo" aria-hidden="true">🎓</span>
          <span className="auth__brand-name">UMAD Progress</span>
        </Link>
      </header>

      <section className="auth__body">
        <div className="auth__intro">
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="text-muted">{subtitle}</p>}
        </div>
        <div className="auth__form">{children}</div>
      </section>

      {footer && <footer className="auth__footer">{footer}</footer>}
    </main>
  );
}