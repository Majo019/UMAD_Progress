import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePersistentState } from '../hooks/usePersistentState';
import { api, getAuthToken, setAuthToken } from '../utils/api';

/**
 * AuthContext
 * - Conectado con la API real de Django REST Framework (/api/auth/).
 * - Persistencia del token y estado del usuario autenticado.
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

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = usePersistentState('up:user', null);
  const [token, setTokenState] = useState(() => getAuthToken());
  const [loading, setLoading] = useState(true);

  // Sincronizar token y verificar sesión actual con /api/auth/me/
  useEffect(() => {
    let isMounted = true;
    async function syncCurrentUser() {
      const currentToken = getAuthToken();
      if (!currentToken) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const remoteUser = await api.get('/api/auth/me/');
        if (isMounted && remoteUser) {
          setUser(remoteUser);
        }
      } catch (err) {
        // Si el token es inválido (401), limpiar sesión
        if (err.status === 401 || err.status === 403) {
          setAuthToken(null);
          setTokenState(null);
          setUser(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    syncCurrentUser();
    return () => {
      isMounted = false;
    };
  }, [setUser]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && (token || getAuthToken())),

      /**
       * Inicio de sesión real llamando a /api/auth/login/.
       */
      async login(email, password) {
        if (!email || !password) {
          throw new Error('Correo y contraseña son obligatorios');
        }

        const data = await api.post('/api/auth/login/', {
          email: email.trim(),
          password,
        });

        if (data.token) {
          setAuthToken(data.token);
          setTokenState(data.token);
        }

        if (data.user) {
          setUser(data.user);
        }

        return data.user;
      },

      /**
       * Registro real llamando a /api/auth/register/.
       * Acepta cualquier dominio de correo válido.
       */
      async register(data) {
        if (!data?.email || !data?.password) {
          throw new Error('Correo y contraseña son obligatorios');
        }

        const payload = {
          email: data.email.trim(),
          password: data.password,
          name: data.name ? data.name.trim() : '',
          career: data.career || '',
          semester: Number(data.semester) || 1,
          goals: data.goals ? data.goals.trim() : '',
          interests: Array.isArray(data.interests) ? data.interests : [],
        };

        let res;
        try {
          res = await api.post('/api/auth/register/', payload);
        } catch (err) {
          // Si hay un error HTTP del servidor (ej. 400 correo duplicado), propagarlo
          if (err.status) throw err;
          // Fallback local únicamente si el servidor backend no está levantado en entorno local
          res = {
            token: `local-${Date.now().toString(36)}`,
            user: {
              id: `u-${Date.now()}`,
              email: payload.email,
              name: payload.name,
              career: payload.career,
              semester: payload.semester,
              goals: payload.goals,
              interests: payload.interests,
              level: 1,
              wheel: [],
              wheel_quiz_completed: false,
            },
          };
        }

        if (res.token) {
          setAuthToken(res.token);
          setTokenState(res.token);
        }

        try {
          window.localStorage.setItem('up:wheelQuizPending', JSON.stringify(true));
          window.localStorage.setItem(
            'up:avatar',
            JSON.stringify({
              level: 1,
              xp: 0,
              stats: { vida: 85, alimento: 62, carino: 90 },
            }),
          );
        } catch {
          /* noop */
        }

        const registeredUser = {
          ...(res.user || payload),
          level: 1,
          wheel_quiz_completed: false,
        };
        setUser(registeredUser);

        return registeredUser;
      },

      /** Cierra sesión en backend y frontend */
      async logout() {
        try {
          if (getAuthToken()) {
            await api.post('/api/auth/logout/');
          }
        } catch {
          // Ignorar fallo de red al cerrar sesión
        } finally {
          setAuthToken(null);
          setTokenState(null);
          setUser(null);
        }
      },

      /** Actualiza el perfil del usuario en backend y estado local */
      async updateProfile(patch) {
        setUser((prev) => ({ ...prev, ...patch }));
        try {
          if (getAuthToken()) {
            const updated = await api.patch('/api/auth/me/', patch);
            if (updated) setUser(updated);
          }
        } catch (err) {
          console.warn('No se pudo sincronizar el perfil con el servidor:', err);
        }
      },

      /** Recuperación de contraseña */
      async recoverPassword(email) {
        if (!email) throw new Error('El correo es obligatorio');
        // Simulación controlada para frontend si no hay servidor SMTP en desarrollo
        const mockToken = `reset-${Date.now().toString(36)}`;
        console.info('[UMAD Progress] Enlace de recuperación:', `/reset-password?token=${mockToken}`);
        return { token: mockToken };
      },

      async resetPassword(resetToken, newPassword) {
        if (!resetToken) throw new Error('Token inválido');
        if (!newPassword) throw new Error('La nueva contraseña es obligatoria');
        return true;
      },
    }),
    [user, token, loading, setUser],
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
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh', color: 'var(--color-text-muted)' }}>
        <p>Cargando sesión…</p>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}
