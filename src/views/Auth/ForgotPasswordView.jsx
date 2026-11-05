import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui';
import { useAuth } from '../../context';
import AuthLayout from './AuthLayout';
import AuthField from './components/AuthField';
import { validateEmail } from './validators';

export default function ForgotPasswordView() {
  const { recoverPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const emailError = touched ? validateEmail(email) : null;

  async function onSubmit(e) {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (validateEmail(email)) return;

    try {
      setSubmitting(true);
      await recoverPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError('No pudimos procesar tu solicitud. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <AuthLayout
        title="Revisa tu correo"
        subtitle="Te enviamos un enlace para restablecer tu contraseña. Si no lo ves, revisa spam."
        footer={
          <p className="text-muted">
            <Link to="/login" className="auth__link">Volver a iniciar sesión</Link>
          </p>
        }
      >
        <div className="auth__success" role="status">
          <CheckCircle2 size={40} aria-hidden="true" />
          <p className="text-muted">
            Enviamos las instrucciones a <strong>{email}</strong>.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Recupera tu acceso"
      subtitle="Escribe tu correo y te enviaremos un enlace para crear una nueva contraseña."
      onBack={() => window.history.back()}
      footer={
        <p className="text-muted">
          <Link to="/login" className="auth__link">Volver a iniciar sesión</Link>
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
          onBlur={() => setTouched(true)}
          error={emailError}
        />

        {error && (
          <p className="auth__banner auth__banner--error" role="alert">{error}</p>
        )}

        <Button type="submit" variant="primary" block icon={Mail} disabled={submitting}>
          {submitting ? 'Enviando…' : 'Enviar enlace de recuperación'}
        </Button>
      </form>
    </AuthLayout>
  );
}