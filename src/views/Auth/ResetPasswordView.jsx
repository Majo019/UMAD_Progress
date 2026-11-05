import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { Button } from '../../components/ui';
import { useAuth } from '../../context';
import AuthLayout from './AuthLayout';
import AuthField from './components/AuthField';
import PasswordStrength from './components/PasswordStrength';
import { validatePassword, validateConfirm } from './validators';

export default function ResetPasswordView() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const errors = useMemo(() => ({
    password: touched.password ? validatePassword(password) : null,
    confirm: touched.confirm ? validateConfirm(password, confirm) : null,
  }), [password, confirm, touched]);

  const isValid = !validatePassword(password) && !validateConfirm(password, confirm);

  async function onSubmit(e) {
    e.preventDefault();
    setTouched({ password: true, confirm: true });
    setError(null);
    if (!isValid) return;

    try {
      setSubmitting(true);
      await resetPassword(token, password);
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err?.message || 'No pudimos actualizar tu contraseña.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <AuthLayout
        title="Enlace inválido"
        subtitle="El enlace que abriste no es válido o ya expiró."
        footer={
          <p className="text-muted">
            <Link to="/forgot-password" className="auth__link">Solicitar un enlace nuevo</Link>
          </p>
        }
      >
        <div className="auth__success" role="status">
          <p className="text-muted">Pide un enlace nuevo desde "Recupera tu acceso".</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Nueva contraseña"
      subtitle="Elige una contraseña segura. La recordarás fácil con una frase."
      footer={
        <p className="text-muted">
          <Link to="/login" className="auth__link">Volver a iniciar sesión</Link>
        </p>
      }
    >
      <form className="stack auth__form-inner" onSubmit={onSubmit} noValidate>
        <div className="auth__password-block">
          <AuthField
            label="Nueva contraseña"
            type="password"
            autoComplete="new-password"
            placeholder="Al menos 8 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            error={errors.password}
          />
          <PasswordStrength value={password} />
        </div>

        <AuthField
          label="Confirma tu contraseña"
          type="password"
          autoComplete="new-password"
          placeholder="Repite la contraseña"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
          error={errors.confirm}
        />

        {error && (
          <p className="auth__banner auth__banner--error" role="alert">{error}</p>
        )}

        <Button type="submit" variant="primary" block icon={KeyRound} disabled={submitting}>
          {submitting ? 'Actualizando…' : 'Actualizar contraseña'}
        </Button>
      </form>
    </AuthLayout>
  );
}