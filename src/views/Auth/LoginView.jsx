import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui';
import { useAuth } from '../../context';
import AuthLayout from './AuthLayout';
import AuthField from './components/AuthField';
import { validateEmail, isUmadEmail } from './validators';

export default function LoginView() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const emailError = touched.email ? validateEmail(email) : null;
  const passwordError = touched.password && !password ? 'La contraseña es obligatoria' : null;
  const institutional = isUmadEmail(email);

  async function onSubmit(e) {
    e.preventDefault();
    setFormError(null);
    setTouched({ email: true, password: true });
    if (validateEmail(email) || !password) return;

    try {
      setSubmitting(true);
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setFormError('No pudimos validar tus datos, inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Bienvenido de vuelta"
      subtitle="Tu espacio de crecimiento te estaba esperando."
      footer={
        <p className="text-muted">
          ¿Aún no tienes cuenta?{' '}
          <Link to="/register" className="auth__link">Crea una aquí</Link>
        </p>
      }
    >
      <form className="stack auth__form-inner" onSubmit={onSubmit} noValidate>
        <AuthField
          label="Correo"
          type="email"
          autoComplete="email"
          placeholder="nombre@umad.edu.mx"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          error={emailError}
          hint={!emailError && institutional ? '✓ Correo institucional UMAD' : undefined}
        />

        <div className="auth__password-block">
          <AuthField
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            placeholder="Tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            error={passwordError}
          />
          <div className="row-between">
            <span className="label-mono auth__secure">
              <ShieldCheck size={12} aria-hidden="true" /> Cifrado seguro
            </span>
            <Link to="/forgot-password" className="auth__link auth__link--sm">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>

        {formError && (
          <p className="auth__banner auth__banner--error" role="alert">{formError}</p>
        )}

        <Button type="submit" variant="primary" block disabled={submitting} icon={LogIn}>
          {submitting ? 'Iniciando…' : 'Iniciar sesión'}
        </Button>
      </form>
    </AuthLayout>
  );
}