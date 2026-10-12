import { createContext, useContext, useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePersistentState } from '../hooks/usePersistentState';

/**
 * AuthContext
 * - Lo consumen las Vistas Auth (4.2 · Zahid) para login / registro / recuperación.
 * - Perfil, Header y Amigos leen `user`.
 * - Mock: cuando haya backend, solo cambian las funciones async.
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

export const UMAD_DOMAIN = '@umad.edu.mx';

/** Simula latencia del backend. */
const wait = (ms = 700) => new Promise((res) => setTimeout(res, ms));

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = usePersistentState('up:user', DEMO_USER);
  // Tokens de recuperación en modo mock: { token, email, expiresAt }
  const [resetTokens, setResetTokens] = usePersistentState('up:resetTokens', []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),

      /** Mock: acepta cualquier correo/contraseña no vacíos. */
      async login(email, password) {
        if (!email || !password) throw new Error('Correo y contraseña son obligatorios');
        await wait();
        setUser((prev) => ({ ...(prev ?? DEMO_USER), email }));
        return true;
      },

      /**
       * Registro con perfil inicial completo (RF-02).
       * Espera: { name, email, password, career, semester, goals, interests[] }
       */
      async register(data) {
        if (!data?.email || !data?.password) {
          throw new Error('Correo y contraseña son obligatorios');
        }
        await wait(900);
        setUser({
          ...DEMO_USER,
          ...data,
          id: `u-${Date.now()}`,
          interests: Array.isArray(data.interests) ? data.interests : [],
          semester: Number(data.semester) || DEMO_USER.semester,
        });
        return true;
      },

      logout() {
        setUser(null);
      },

      updateProfile(patch) {
        setUser((prev) => ({ ...prev, ...patch }));
      },

      /**
       * MOCK: "envía" un correo de recuperación.
       * Devuelve { token } y lo loguea en consola para poder probar el flujo Reset.
       */
      async recoverPassword(email) {
        if (!email) throw new Error('El correo es obligatorio');
        await wait(800);
        const token = `mock-${Date.now().toString(36)}`;
        const entry = {
          token,
          email,
          expiresAt: Date.now() + 1000 * 60 * 30, // 30 min
        };
        setResetTokens((prev) => [...prev.filter((t) => t.email !== email), entry]);
        // eslint-disable-next-line no-console
        console.info(
          '[UMAD Progress][mock] Enlace de recuperación:',
          `/reset-password?token=${token}`,
        );
        return { token };
      },

      /** MOCK: valida token y actualiza la contraseña. */
      async resetPassword(token, newPassword) {
        if (!token) throw new Error('Token inválido');
        if (!newPassword) throw new Error('La nueva contraseña es obligatoria');
        await wait(700);
        const entry = resetTokens.find((t) => t.token === token);
        if (!entry) throw new Error('El enlace expiró o no es válido');
        if (Date.now() > entry.expiresAt) {
          setResetTokens((prev) => prev.filter((t) => t.token !== token));
          throw new Error('El enlace expiró. Solicita uno nuevo.');
        }
        setResetTokens((prev) => prev.filter((t) => t.token !== token));
        return true;
      },
    }),
    [user, setUser, resetTokens, setResetTokens],
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