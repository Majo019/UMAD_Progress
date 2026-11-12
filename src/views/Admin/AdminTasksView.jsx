import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ListChecks, Search, Trash2, X } from 'lucide-react';
import { Button, EmptyState, Modal } from '../../components/ui';
import { AdminPageHeader, Pagination } from './AdminLayout';
import { AREA_LABELS, DIFFICULTY_COLORS, DIFFICULTY_LABELS, adminApi, formatDate } from './adminApi';

export default function AdminTasksView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const userFilter = searchParams.get('user') || '';

  const [filters, setFilters] = useState({ search: '', status: '', difficulty: '', area: '' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await adminApi.listTasks({ ...filters, user: userFilter, page }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, userFilter, page]);

  useEffect(() => {
    const id = setTimeout(load, 250);
    return () => clearTimeout(id);
  }, [load]);

  function updateFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  }

  async function confirmDelete() {
    const t = toDelete;
    setToDelete(null);
    try {
      await adminApi.deleteTask(t.id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const filteredUser = userFilter && data?.results[0]?.user_id === Number(userFilter) ? data.results[0].user_email : null;

  return (
    <div className="stack adm-page">
      <AdminPageHeader title="Tareas" subtitle="Supervisa las tareas creadas por los alumnos en la plataforma." />

      {userFilter && (
        <div className="adm-active-filter">
          <span>
            Mostrando tareas de <strong>{filteredUser || `usuario #${userFilter}`}</strong>
          </span>
          <button type="button" className="icon-btn icon-btn--sm" aria-label="Quitar filtro" onClick={() => setSearchParams({})}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="adm-filters">
        <label className="adm-search">
          <Search size={16} aria-hidden="true" />
          <input
            className="input"
            placeholder="Buscar por título, descripción o alumno…"
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
          />
        </label>
        <select className="input" value={filters.status} onChange={(e) => updateFilter('status', e.target.value)} aria-label="Filtrar por estado">
          <option value="">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="completed">Completadas</option>
        </select>
        <select className="input" value={filters.difficulty} onChange={(e) => updateFilter('difficulty', e.target.value)} aria-label="Filtrar por dificultad">
          <option value="">Todas las dificultades</option>
          {Object.entries(DIFFICULTY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select className="input" value={filters.area} onChange={(e) => updateFilter('area', e.target.value)} aria-label="Filtrar por área">
          <option value="">Todas las áreas</option>
          {Object.entries(AREA_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {error && <p className="adm-alert adm-alert--error" role="alert">{error}</p>}

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Tarea</th>
              <th>Alumno</th>
              <th>Área</th>
              <th>Dificultad</th>
              <th>Estado</th>
              <th>Entrega</th>
              <th>Creada</th>
              <th aria-label="Acciones" />
            </tr>
          </thead>
          <tbody>
            {data?.results.map((t) => (
              <tr key={t.id}>
                <td>
                  <span className={`adm-list__title ${t.completed ? 'is-done' : ''}`}>{t.title}</span>
                  {t.description && <span className="adm-list__sub adm-truncate">{t.description}</span>}
                </td>
                <td>
                  <Link to={`/admin/usuarios/${t.user_id}`} className="adm-link">{t.user_name}</Link>
                  <span className="adm-list__sub">{t.user_email}</span>
                </td>
                <td className="text-muted">{AREA_LABELS[t.area] || t.area || '—'}</td>
                <td><span className={`chip chip--${DIFFICULTY_COLORS[t.difficulty] || 'neutral'}`}>{DIFFICULTY_LABELS[t.difficulty] || t.difficulty}</span></td>
                <td>
                  <span className={`chip ${t.completed ? 'chip--green' : 'chip--neutral'}`}>
                    {t.completed ? 'Completada' : 'Pendiente'}
                  </span>
                </td>
                <td className="text-muted">{t.due_date || '—'}</td>
                <td className="text-muted">{formatDate(t.created_at)}</td>
                <td>
                  <button
                    type="button"
                    className="icon-btn icon-btn--sm adm-danger"
                    title="Eliminar tarea"
                    aria-label="Eliminar tarea"
                    onClick={() => setToDelete(t)}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && data?.results.length === 0 && (
          <EmptyState icon={ListChecks} title="Sin tareas">No hay tareas que coincidan con los filtros.</EmptyState>
        )}
        {loading && !data && <p className="text-muted adm-pad">Cargando tareas…</p>}
      </div>

      {data && (
        <div className="row-between">
          <span className="text-muted">{data.count} tarea{data.count === 1 ? '' : 's'}</span>
          <Pagination page={data.page} pages={data.pages} onChange={setPage} />
        </div>
      )}

      <Modal
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        title="Eliminar tarea"
        footer={
          <>
            <Button variant="secondary" onClick={() => setToDelete(null)}>Cancelar</Button>
            <Button variant="danger" icon={Trash2} onClick={confirmDelete}>Eliminar</Button>
          </>
        }
      >
        <p>
          ¿Eliminar la tarea <strong>{toDelete?.title}</strong> de {toDelete?.user_email}? Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  );
}
