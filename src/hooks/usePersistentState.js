import { useEffect, useState } from 'react';

const resolve = (value) => (typeof value === 'function' ? value() : value);

/**
 * useState que se guarda en localStorage.
 * Mientras no haya backend, así los datos sobreviven al recargar la página.
 * Cuando exista API, solo se cambia este hook o el contexto que lo usa.
 */
export function usePersistentState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : resolve(initialValue);
    } catch {
      return resolve(initialValue);
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* almacenamiento no disponible: se queda solo en memoria */
    }
  }, [key, state]);

  return [state, setState];
}

export function clearPersistedState(prefix = 'up:') {
  try {
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith(prefix))
      .forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* noop */
  }
}
