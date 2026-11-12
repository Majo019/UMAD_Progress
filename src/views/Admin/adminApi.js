import { api } from '../../utils/api';

function qs(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, value);
  });
  const str = search.toString();
  return str ? `?${str}` : '';
}

/** Cliente de los endpoints exclusivos del rol admin (/api/admin/). */
export const adminApi = {
  getStats: () => api.get('/api/admin/stats/'),

  getProfile: () => api.get('/api/admin/profile/'),
  updateProfile: (patch) => api.patch('/api/admin/profile/', patch),

  listUsers: (params) => api.get(`/api/admin/users/${qs(params)}`),
  getUser: (id) => api.get(`/api/admin/users/${id}/`),
  updateUser: (id, patch) => api.patch(`/api/admin/users/${id}/`, patch),
  deleteUser: (id) => api.delete(`/api/admin/users/${id}/`),

  listTasks: (params) => api.get(`/api/admin/tasks/${qs(params)}`),
  deleteTask: (id) => api.delete(`/api/admin/tasks/${id}/`),
};

export function formatDate(value, withTime = false) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

export const DIFFICULTY_COLORS = { dificil: 'coral', media: 'amber', tranquila: 'green' };
export const DIFFICULTY_LABELS = { dificil: 'Difícil', media: 'Media', tranquila: 'Tranquila' };

/** Áreas de la rueda de la vida (mismas claves que usa la app del alumno). */
export const AREA_LABELS = {
  amigos: 'Amigos',
  trabajo: 'Trabajo',
  familia: 'Familia',
  deporte: 'Deporte',
  economia: 'Economía',
  retrospeccion: 'Retrospección',
  ocio: 'Ocio',
  alimentacion: 'Alimentación',
};
