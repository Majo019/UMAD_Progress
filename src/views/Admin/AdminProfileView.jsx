import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Moon, Save, ShieldCheck, Sun } from 'lucide-react';
import { Button, Card, Field, UserAvatar } from '../../components/ui';
import { useAuth, useTheme } from '../../context';
import { AdminPageHeader } from './AdminLayout';
import { adminApi, formatDate } from './adminApi';

const EMPTY = { display_name: '', position: '', department: '', phone: '', bio: '' };

export default function AdminProfileView() {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    adminApi
      .getProfile()
      .then((data) => {
        setProfile(data);
        setForm({ ...EMPTY, ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, data[k] || ''])) });
      })
      .catch((err) => setMessage({ type: 'error', text: err.message }));
  }, []);

  function update(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const updated = await adminApi.updateProfile(form);
      setProfile(updated);
      setMessage({ type: 'success', text: 'Perfil actualizado correctamente.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="stack adm-page">
      <AdminPageHeader title="Mi perfil" subtitle="Información de tu cuenta de administrador." />

      <section className="adm-grid-profile">
        <Card className="adm-profile-card">
          <UserAvatar name={form.display_name || profile?.email || 'Admin'} size={88} />
          <p className="section-title">{form.display_name || 'Administrador'}</p>
          <p className="text-muted">{profile?.email}</p>
          <span className="chip chip--coral">
            <ShieldCheck size={12} aria-hidden="true" /> Administrador
          </span>
          <div className="adm-info-row">
            <span className="label-mono">Miembro desde</span>
            <span>{formatDate(profile?.date_joined)}</span>
          </div>
          <div className="adm-info-row">
            <span className="label-mono">Último acceso</span>
            <span>{formatDate(profile?.last_login, true)}</span>
          </div>
          <div className="adm-profile-card__actions">
            <Button variant="secondary" size="sm" icon={theme === 'dark' ? Sun : Moon} onClick={toggleTheme}>
              Tema {theme === 'dark' ? 'claro' : 'oscuro'}
            </Button>
            <Button variant="danger" size="sm" icon={LogOut} onClick={handleLogout}>
              Cerrar sesión
            </Button>
          </div>
        </Card>

        <Card>
          <form className="stack" onSubmit={onSubmit}>
            <h2 className="section-title">Datos del administrador</h2>
            <div className="form-grid form-grid--2">
              <Field label="Nombre a mostrar" value={form.display_name} onChange={update('display_name')} maxLength={200} />
              <Field label="Cargo" placeholder="Ej. Coordinación académica" value={form.position} onChange={update('position')} maxLength={150} />
              <Field label="Departamento" placeholder="Ej. Bienestar estudiantil" value={form.department} onChange={update('department')} maxLength={150} />
              <Field label="Teléfono" type="tel" value={form.phone} onChange={update('phone')} maxLength={30} />
            </div>
            <Field label="Biografía" as="textarea" rows={4} value={form.bio} onChange={update('bio')} />

            {message && (
              <p className={`adm-alert adm-alert--${message.type}`} role={message.type === 'error' ? 'alert' : 'status'}>
                {message.text}
              </p>
            )}

            <div>
              <Button type="submit" icon={Save} disabled={saving || !profile}>
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        </Card>
      </section>
    </div>
  );
}
