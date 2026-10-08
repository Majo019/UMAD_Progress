import { createContext, useContext, useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePersistentState } from '../hooks/usePersistentState';

/**
 * AuthContext
 * - Lo consumen las Vistas Auth (4.2 · Zahid) para login / registro.
 * - Perfil, Header y Amigos leen `user`.
 * Por ahora es un mock: cuando haya backend, solo cambian login/register/logout.
 */

export const DEMO_USER = {
  id: 'u-demo',
  name: 'Pablo Montoro',
  email: 'pablo.montoro@umad.edu.mx',
  career: 'Ing. Software',
  semester: 5,
  goals: 'Dormir mejor y no dejar las entregas para el último día',
  interests: ['Programación', 'Videojuegos', 'Diseño', 'Lectura', 'Cine'],
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = usePersistentState('up:user', DEMO_USER);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),

      /** Mock: acepta cualquier correo/contraseña no vacíos. */
      async login(email, password) {
        if (!email || !password) throw new Error('Correo y contraseña son obligatorios');
        setUser((prev) => ({ ...(prev ?? DEMO_USER), email }));
        return true;
      },

      async register(data) {
        setUser({ ...DEMO_USER, ...data, id: `u-${Date.now()}` });
        return true;
      },

      logout() {
        setUser(null);
      },

      updateProfile(patch) {
        setUser((prev) => ({ ...prev, ...patch }));
      },
    }),
    [user, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

/** Envuelve rutas privadas: si no hay sesión, manda a /login. */
export function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}
