// En Render, VITE_API_URL llega como host sin protocolo (ej. umad-progress-api.onrender.com)
const RAW_API_URL = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
const BASE_URL = RAW_API_URL && !/^https?:\/\//.test(RAW_API_URL) ? `https://${RAW_API_URL}` : RAW_API_URL;

export function getAuthToken() {
  try {
    const raw = localStorage.getItem('up:token');
    if (!raw) return null;
    return raw.startsWith('"') ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('up:token', JSON.stringify(token));
  } else {
    localStorage.removeItem('up:token');
  }
}

export async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Token ${token}`;
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json().catch(() => null);
  } else {
    const text = await response.text().catch(() => '');
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const errorMessage =
      (typeof data === 'object' && data?.detail)
        ? data.detail
        : (typeof data === 'object' && data !== null)
          ? Object.entries(data)
              .map(([k, v]) => `${Array.isArray(v) ? v.join(', ') : v}`)
              .join(' ')
          : 'Ocurrió un error en el servidor.';
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  get: (url, options) => apiRequest(url, { ...options, method: 'GET' }),
  post: (url, body, options) =>
    apiRequest(url, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (url, body, options) =>
    apiRequest(url, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  patch: (url, body, options) =>
    apiRequest(url, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: (url, options) => apiRequest(url, { ...options, method: 'DELETE' }),
};

