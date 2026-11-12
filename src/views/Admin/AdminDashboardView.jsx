import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Flame, ListChecks, RefreshCw, Timer, Trophy, UserPlus, Users } from 'lucide-react';
import { Button, Card, EmptyState, UserAvatar } from '../../components/ui';
import { useAuth } from '../../context';
import { AdminPageHeader, RoleBadge, StatCard, StatusBadge } from './AdminLayout';
import { AREA_LABELS, adminApi, formatDate } from './adminApi';

function SignupsChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <figure className="adm-chart" aria-label="Registros de usuarios en los últimos 7 días">
      <div className="adm-chart__plot">
        {data.map((d) => {
          const label = new Date(`${d.date}T00:00:00`).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' });
          return (
            <div key={d.date} className="adm-chart__col" tabIndex={0} aria-label={`${label}: ${d.count} registros`}>
              <span className="adm-chart__tip" role="tooltip">
                {label} · <strong>{d.count}</strong> {d.count === 1 ? 'registro' : 'registros'}
              </span>
              <div className="adm-chart__bar-wrap">
                <div className="adm-chart__bar" style={{ height: `${(d.count / max) * 100}%` }} />
              </div>
              <span className="adm-chart__x">{label}</span>
            </div>
          );
        })}
      </div>
    </figure>
  );
}

function AreaBars({ data }) {
  if (!data.length) return <EmptyState icon={ListChecks} title="Sin tareas registradas" />;
  const max = Math.max(1, ...data.map((d) => d.total));
  return (
    <ul className="adm-hbars">
      {data.map((d) => {
        const name = AREA_LABELS[d.area] || d.area || 'Sin área';
        return (
          <li key={d.area || 'none'} className="adm-hbars__row" title={`${name}: ${d.completed} de ${d.total} completadas`}>
            <span className="adm-hbars__label">{name}</span>
            <div className="adm-hbars__track">
              <div className="adm-hbars__fill" style={{ width: `${(d.total / max) * 100}%` }} />
            </div>
            <span className="adm-hbars__value">
              {d.completed}/{d.total}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default function AdminDashboardView() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setStats(await adminApi.getStats());
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las estadísticas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const firstName = (user?.name || '').split(' ')[0] || 'admin';

  return (
    <div className="stack adm-page">
      <AdminPageHeader
        title={`Hola, ${firstName}`}
        subtitle="Resumen general de la actividad en UMAD Progress."
        actions={
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={load} disabled={loading}>
            Actualizar
          </Button>
        }
      />

      {error && <p className="adm-alert adm-alert--error" role="alert">{error}</p>}
      {loading && !stats && <p className="text-muted">Cargando estadísticas…</p>}

      {stats && (
        <>
          <section className="adm-stats-grid">
            <StatCard icon={Users} label="Alumnos" value={stats.users.total} hint={`${stats.users.active} activos · ${stats.users.inactive} inactivos`} />
            <StatCard icon={UserPlus} label="Nuevos (7 días)" value={stats.users.new_last_7_days} hint={`${stats.users.admins} administradores`} color="coral" />
            <StatCard icon={CheckCircle2} label="Tareas completadas" value={`${stats.tasks.completion_rate}%`} hint={`${stats.tasks.completed} de ${stats.tasks.total} tareas`} color="green" />
            <StatCard icon={Timer} label="Minutos de enfoque" value={stats.pomodoro.focus_minutes} hint={`${stats.pomodoro.completed_sessions} pomodoros completados`} color="amber" />
          </section>

          <section className="adm-grid-2">
            <Card>
              <div className="row-between adm-card-head">
                <h2 className="section-title">Registros de los últimos 7 días</h2>
              </div>
              <SignupsChart data={stats.signups_last_7_days} />
            </Card>
            <Card>
              <div className="row-between adm-card-head">
                <h2 className="section-title">Tareas por área</h2>
                <span className="label-mono">completadas / total</span>
              </div>
              <AreaBars data={stats.tasks.by_area} />
            </Card>
          </section>

          <section className="adm-grid-2">
            <Card>
              <div className="row-between adm-card-head">
                <h2 className="section-title">Usuarios recientes</h2>
                <Link to="/admin/usuarios" className="adm-link">Ver todos</Link>
              </div>
              {stats.recent_users.length === 0 ? (
                <EmptyState icon={Users} title="Aún no hay usuarios" />
              ) : (
                <ul className="adm-list">
                  {stats.recent_users.map((u) => (
                    <li key={u.id}>
                      <Link to={`/admin/usuarios/${u.id}`} className="adm-list__item">
                        <UserAvatar name={u.name || u.email} size={36} />
                        <div className="adm-list__text">
                          <p className="adm-list__title">{u.name}</p>
                          <p className="adm-list__sub">{u.email} · {formatDate(u.date_joined)}</p>
                        </div>
                        <RoleBadge role={u.role} />
                        <StatusBadge active={u.is_active} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <div className="row-between adm-card-head">
                <h2 className="section-title">Top alumnos por nivel</h2>
                <span className="label-mono">Nivel promedio {stats.gamification.average_level}</span>
              </div>
              {stats.top_users.length === 0 ? (
                <EmptyState icon={Trophy} title="Sin datos de progreso" />
              ) : (
                <ol className="adm-list">
                  {stats.top_users.map((u, i) => (
                    <li key={u.id}>
                      <Link to={`/admin/usuarios/${u.id}`} className="adm-list__item">
                        <span className="adm-rank">{i + 1}</span>
                        <div className="adm-list__text">
                          <p className="adm-list__title">{u.name}</p>
                          <p className="adm-list__sub">{u.email}</p>
                        </div>
                        <span className="chip chip--amber">
                          <Flame size={12} aria-hidden="true" /> Nv. {u.level}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
