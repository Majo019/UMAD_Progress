import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShieldCheck, ShieldOff, Trash2, UserCheck, UserX, Users } from 'lucide-react';
import { Button, EmptyState, Modal, UserAvatar } from '../../components/ui';
import { useAuth } from '../../context';
import { AdminPageHeader, Pagination, RoleBadge, StatusBadge } from './AdminLayout';
import { adminApi, formatDate } from './adminApi';

export default function AdminUsersView() {
  const { user: me } = useAuth();
  const [filters, setFilters] = useState({ search: '', role: '', status: '' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await adminApi.listUsers({ ...filters, page }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  // Búsqueda con pequeño debounce
  useEffect(() => {
    const id = setTimeout(load, 250);
    return () => clearTimeout(id);
  }, [load]);

  function updateFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  }

  async function patchUser(u, patch) {
    setBusyId(u.id);
    setError(null);
    try {
      const updated = await adminApi.updateUser(u.id, patch);
      setData((d) => ({ ...d, results: d.results.map((r) => (r.id === u.id ? { ...r, ...updated } : r)) }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    const u = toDelete;
    setToDelete(null);
    setBusyId(u.id);
    try {
      await adminApi.deleteUser(u.id);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="stack adm-page">
      <AdminPageHeader title="Usuarios" subtitle="Gestiona cuentas, roles y acceso a la plataforma." />

      <div className="adm-filters">
        <label className="adm-search">
          <Search size={16} aria-hidden="true" />
          <input
            className="input"
            placeholder="Buscar por nombre, correo o carrera…"
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
          />
        </label>
        <select className="input" value={filters.role} onChange={(e) => updateFilter('role', e.target.value)} aria-label="Filtrar por rol">
          <option value="">Todos los roles</option>
          <option value="user">Usuarios</option>
          <option value="admin">Administradores</option>
        </select>
        <select className="input" value={filters.status} onChange={(e) => updateFilter('status', e.target.value)} aria-label="Filtrar por estado">
          <option value="">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
      </div>

      {error && <p className="adm-alert adm-alert--error" role="alert">{error}</p>}

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Carrera</th>
              <th className="num">Nivel</th>
              <th className="num">Tareas</th>
              <th>Registro</th>
              <th aria-label="Acciones" />
            </tr>
          </thead>
          <tbody>
            {data?.results.map((u) => {
              const isMe = u.id === me?.id;
              const busy = busyId === u.id;
              return (
                <tr key={u.id}>
                  <td>
                    <Link to={`/admin/usuarios/${u.id}`} className="adm-user-cell">
                      <UserAvatar name={u.name || u.email} size={32} />
                      <span>
                        <span className="adm-list__title">{u.name}{isMe && ' (tú)'}</span>
                        <span className="adm-list__sub">{u.email}</span>
                      </span>
                    </Link>
                  </td>
                  <td><RoleBadge role={u.role} /></td>
                  <td><StatusBadge active={u.is_active} /></td>
                  <td className="text-muted">{u.career || '—'}{u.career && u.semester ? ` · ${u.semester}°` : ''}</td>
                  <td className="num">{u.level}</td>
                  <td className="num">{u.tasks_completed}/{u.tasks_total}</td>
                  <td className="text-muted">{formatDate(u.date_joined)}</td>
                  <td>
                    <div className="adm-actions">
                      <button
                        type="button"
                        className="icon-btn icon-btn--sm"
                        disabled={busy || isMe}
                        title={u.role === 'admin' ? 'Quitar rol de admin' : 'Hacer administrador'}
                        aria-label={u.role === 'admin' ? 'Quitar rol de admin' : 'Hacer administrador'}
                        onClick={() => patchUser(u, { role: u.role === 'admin' ? 'user' : 'admin' })}
                      >
                        {u.role === 'admin' ? <ShieldOff size={16} /> : <ShieldCheck size={16} />}
                      </button>
                      <button
                        type="button"
                        className="icon-btn icon-btn--sm"
                        disabled={busy || isMe}
                        title={u.is_active ? 'Desactivar cuenta' : 'Activar cuenta'}
                        aria-label={u.is_active ? 'Desactivar cuenta' : 'Activar cuenta'}
                        onClick={() => patchUser(u, { is_active: !u.is_active })}
                      >
                        {u.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>
                      <button
                        type="button"
                        className="icon-btn icon-btn--sm adm-danger"
                        disabled={busy || isMe}
                        title="Eliminar cuenta"
                        aria-label="Eliminar cuenta"
                        onClick={() => setToDelete(u)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && data?.results.length === 0 && (
          <EmptyState icon={Users} title="Sin resultados">Prueba con otros filtros de búsqueda.</EmptyState>
        )}
        {loading && !data && <p className="text-muted adm-pad">Cargando usuarios…</p>}
      </div>

      {data && (
        <div className="row-between">
          <span className="text-muted">{data.count} usuario{data.count === 1 ? '' : 's'}</span>
          <Pagination page={data.page} pages={data.pages} onChange={setPage} />
        </div>
      )}

      <Modal
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        title="Eliminar cuenta"
        footer={
          <>
            <Button variant="secondary" onClick={() => setToDelete(null)}>Cancelar</Button>
            <Button variant="danger" icon={Trash2} onClick={confirmDelete}>Eliminar</Button>
          </>
        }
      >
        <p>
          ¿Seguro que quieres eliminar la cuenta de <strong>{toDelete?.email}</strong>? Se borrarán también sus tareas,
          pomodoros y progreso. Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  );
}
