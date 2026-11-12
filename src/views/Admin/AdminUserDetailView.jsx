import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ListChecks, ShieldCheck, ShieldOff, Trash2, UserCheck, UserX } from 'lucide-react';
import { Button, Card, EmptyState, Modal, ProgressBar, UserAvatar } from '../../components/ui';
import { useAuth } from '../../context';
import { AdminPageHeader, RoleBadge, StatusBadge } from './AdminLayout';
import { AREA_LABELS, DIFFICULTY_COLORS, DIFFICULTY_LABELS, adminApi, formatDate } from './adminApi';

function InfoRow({ label, children }) {
  return (
    <div className="adm-info-row">
      <span className="label-mono">{label}</span>
      <span>{children || '—'}</span>
    </div>
  );
}

export default function AdminUserDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const [u, setU] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let alive = true;
    adminApi
      .getUser(id)
      .then((data) => alive && setU(data))
      .catch((err) => alive && setError(err.status === 404 ? 'Usuario no encontrado.' : err.message));
    return () => {
      alive = false;
    };
  }, [id]);

  async function patch(changes) {
    setBusy(true);
    setError(null);
    try {
      setU(await adminApi.updateUser(id, changes));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setConfirmDelete(false);
    setBusy(true);
    try {
      await adminApi.deleteUser(id);
      navigate('/admin/usuarios', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const back = (
    <Link to="/admin/usuarios" className="adm-link adm-back">
      <ArrowLeft size={16} aria-hidden="true" /> Volver a usuarios
    </Link>
  );

  if (!u) {
    return (
      <div className="stack adm-page">
        {back}
        {error ? <p className="adm-alert adm-alert--error">{error}</p> : <p className="text-muted">Cargando…</p>}
      </div>
    );
  }

  const isMe = u.id === me?.id;
  const p = u.profile || {};
  const completionRate = u.tasks_total ? Math.round((u.tasks_completed * 100) / u.tasks_total) : 0;

  return (
    <div className="stack adm-page">
      {back}
      <AdminPageHeader
        title={u.name}
        subtitle={u.email}
        actions={
          !isMe && (
            <>
              <Button
                variant="secondary"
                size="sm"
                disabled={busy}
                icon={u.role === 'admin' ? ShieldOff : ShieldCheck}
                onClick={() => patch({ role: u.role === 'admin' ? 'user' : 'admin' })}
              >
                {u.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={busy}
                icon={u.is_active ? UserX : UserCheck}
                onClick={() => patch({ is_active: !u.is_active })}
              >
                {u.is_active ? 'Desactivar' : 'Activar'}
              </Button>
              <Button variant="danger" size="sm" disabled={busy} icon={Trash2} onClick={() => setConfirmDelete(true)}>
                Eliminar
              </Button>
            </>
          )
        }
      />

      {error && <p className="adm-alert adm-alert--error" role="alert">{error}</p>}

      <section className="adm-grid-3">
        <Card className="adm-profile-card">
          <UserAvatar name={u.name || u.email} size={72} />
          <div className="adm-badges">
            <RoleBadge role={u.role} />
            <StatusBadge active={u.is_active} />
          </div>
          <InfoRow label="Carrera">{p.career}</InfoRow>
          <InfoRow label="Semestre">{p.semester ? `${p.semester}°` : null}</InfoRow>
          <InfoRow label="Registro">{formatDate(u.date_joined)}</InfoRow>
          <InfoRow label="Último acceso">{formatDate(u.last_login, true)}</InfoRow>
          <InfoRow label="Amigos">{String(u.friends_count)}</InfoRow>
        </Card>

        <Card>
          <h2 className="section-title adm-card-head">Progreso</h2>
          <div className="stack">
            <div className="adm-kpis">
              <div><p className="label-mono">Nivel</p><p className="adm-stat__value">{u.avatar?.level ?? 1}</p></div>
              <div><p className="label-mono">Pomodoros</p><p className="adm-stat__value">{u.pomodoro.completed_sessions}</p></div>
              <div><p className="label-mono">Enfoque</p><p className="adm-stat__value">{u.pomodoro.focus_minutes}<small> min</small></p></div>
            </div>
            <ProgressBar label="Tareas completadas" value={completionRate} color="green" />
            {u.avatar && (
              <>
                <ProgressBar label="Vida" value={u.avatar.vida} color="coral" />
                <ProgressBar label="Alimento" value={u.avatar.alimento} color="amber" />
                <ProgressBar label="Cariño" value={u.avatar.carino} color="blue" />
              </>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="section-title adm-card-head">Perfil del alumno</h2>
          <div className="stack">
            <div>
              <p className="label-mono">Metas</p>
              <p>{p.goals || <span className="text-muted">Sin metas registradas</span>}</p>
            </div>
            <div>
              <p className="label-mono">Intereses</p>
              <div className="adm-badges adm-badges--wrap">
                {(p.interests || []).length ? (
                  p.interests.map((i) => <span key={i} className="chip chip--neutral">{i}</span>)
                ) : (
                  <span className="text-muted">—</span>
                )}
              </div>
            </div>
            <div>
              <p className="label-mono">Rueda de la vida</p>
              {p.wheel_quiz_completed && (p.wheel || []).length ? (
                <ul className="adm-hbars">
                  {p.wheel.map((a) => (
                    <li key={a.key} className="adm-hbars__row">
                      <span className="adm-hbars__label">{a.label || AREA_LABELS[a.key] || a.key}</span>
                      <div className="adm-hbars__track">
                        <div className="adm-hbars__fill" style={{ width: `${Math.min(100, (Number(a.value) || 0) * 10)}%` }} />
                      </div>
                      <span className="adm-hbars__value">{a.value}/10</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">Cuestionario no completado</p>
              )}
            </div>
          </div>
        </Card>
      </section>

      {u.admin_profile && (
        <Card>
          <h2 className="section-title adm-card-head">Perfil de administrador</h2>
          <div className="adm-grid-2">
            <InfoRow label="Nombre a mostrar">{u.admin_profile.display_name}</InfoRow>
            <InfoRow label="Cargo">{u.admin_profile.position}</InfoRow>
            <InfoRow label="Departamento">{u.admin_profile.department}</InfoRow>
            <InfoRow label="Teléfono">{u.admin_profile.phone}</InfoRow>
          </div>
        </Card>
      )}

      <Card>
        <div className="row-between adm-card-head">
          <h2 className="section-title">Tareas recientes</h2>
          <Link to={`/admin/tareas?user=${u.id}`} className="adm-link">Ver todas ({u.tasks_total})</Link>
        </div>
        {u.recent_tasks.length === 0 ? (
          <EmptyState icon={ListChecks} title="Sin tareas" />
        ) : (
          <ul className="adm-list">
            {u.recent_tasks.map((t) => (
              <li key={t.id} className="adm-list__item">
                <div className="adm-list__text">
                  <p className={`adm-list__title ${t.completed ? 'is-done' : ''}`}>{t.title}</p>
                  <p className="adm-list__sub">
                    {AREA_LABELS[t.area] || t.area} · creada {formatDate(t.created_at)}
                  </p>
                </div>
                <span className={`chip chip--${DIFFICULTY_COLORS[t.difficulty] || 'neutral'}`}>{DIFFICULTY_LABELS[t.difficulty] || t.difficulty}</span>
                <span className={`chip ${t.completed ? 'chip--green' : 'chip--neutral'}`}>
                  {t.completed ? 'Completada' : 'Pendiente'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Eliminar cuenta"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
            <Button variant="danger" icon={Trash2} onClick={remove}>Eliminar</Button>
          </>
        }
      >
        <p>
          ¿Eliminar la cuenta de <strong>{u.email}</strong> junto con todo su progreso? Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  );
}
