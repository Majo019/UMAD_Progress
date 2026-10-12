import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Card, Field } from '../../components/ui';
import { useAuth } from '../../context';

/**
 * Login provisional para poder probar la app.
 * ⚠️ Las Vistas Auth (4.2) las hace Zahid; solo tiene que usar useAuth().login(...)
 */
export default function LoginPlaceholder() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('pablo.montoro@umad.edu.mx');
  const [password, setPassword] = useState('demo');

  const submit = async (e) => {
    e.preventDefault();
    await login(email, password);
    navigate(location.state?.from?.pathname ?? '/', { replace: true });
  };

  return (
    <div className="app-shell" style={{ justifyContent: 'center', padding: 'var(--space-6)' }}>
      <Card as="form" onSubmit={submit} className="stack">
        <h1 className="page-title">Iniciar sesión</h1>
        <p className="text-muted" style={{ fontSize: 'var(--fs-sm)' }}>
          Login temporal (4.2 Vistas Auth · Zahid Serna).
        </p>
        <Field label="Correo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Field label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Button type="submit" block>
          Entrar
        </Button>
      </Card>
    </div>
  );
}
