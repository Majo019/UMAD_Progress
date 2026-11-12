import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { usePersistentState } from '../hooks/usePersistentState';
import { useAuth } from './AuthContext';
import { DEFAULT_LOOK, normalizeLook } from '../components/avatar/sprites';
import { api, getAuthToken } from '../utils/api';

/**
 * AvatarContext
 * Estado de la mascota/avatar y de la Rueda de la Vida.
 * - Widget Avatar Interactivo (4.5 · Zahid) lee `stats`, `level`, `xp`.
 * - Lista de tareas (4.3 · Moisés) llama a `applyReward({ vida: 5, alimento: 5 })`
 *   cuando se completa una tarea.
 * - Pomodoro (4.6 · Moisés) puede llamar `applyReward({ xp: 15 })` al terminar un bloque.
 */

export const STAT_KEYS = ['vida', 'alimento', 'carino'];

export const STAT_META = {
  vida: { label: 'Vida', color: 'coral' },
  alimento: { label: 'Alimento', color: 'green' },
  carino: { label: 'Cariño', color: 'blue' },
};

export const XP_PER_LEVEL = 100;

const INITIAL_AVATAR = {
  level: 1,
  xp: 0,
  stats: { vida: 85, alimento: 62, carino: 90 },
};

// Orden en sentido horario empezando arriba (como en el mockup)
export const WHEEL_AREAS = [
  { key: 'amigos', label: 'Amigos', value: 5 },
  { key: 'trabajo', label: 'Trabajo', value: 5 },
  { key: 'familia', label: 'Familia', value: 5 },
  { key: 'deporte', label: 'Deporte', value: 5 },
  { key: 'economia', label: 'Economía', value: 5 },
  { key: 'retrospeccion', label: 'Retrospección', value: 5 },
  { key: 'ocio', label: 'Ocio', value: 5 },
  { key: 'alimentacion', label: 'Alimentación', value: 5 },
];

const INITIAL_WHEEL = WHEEL_AREAS;

/**
 * Reglas de la rueda (las aplica el servidor, ver backend/authentication/wheel.py):
 * - El cuestionario inicial se responde una sola vez.
 * - Cada día todas las áreas bajan 0.2.
 * - Completar una tarea suma puntos al área elegida según su dificultad.
 */
export const WHEEL_DAILY_DECAY = 0.2;
export const WHEEL_POINTS_BY_DIFFICULTY = { tranquila: 0.2, media: 0.5, dificil: 1 };

/** Muestra un valor de la rueda con máximo un decimal (7, 6.8, ...). */
export const formatWheelValue = (value) => String(Math.round((Number(value) || 0) * 10) / 10);

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const round1 = (n) => Math.round(n * 10) / 10;

const AvatarContext = createContext(null);

export function AvatarProvider({ children }) {
  const { user, isAuthenticated, updateProfile, setServerUser } = useAuth();
  const [avatar, setAvatar] = usePersistentState('up:avatar', INITIAL_AVATAR);
  const [wheel, setWheel] = usePersistentState('up:wheel', INITIAL_WHEEL);
  const [look, setLookState] = usePersistentState('up:avatarLook', DEFAULT_LOOK);

  // Migración: quien tenía el nivel 14 por defecto pasa a nivel 1
  useEffect(() => {
    if (avatar.level === 14 && avatar.xp === 40) {
      setAvatar((prev) => ({ ...prev, level: 1, xp: 0 }));
    }
  }, [avatar.level, avatar.xp, setAvatar]);

  // Migración: quien ya tenía guardada la rueda con "Espiritualidad" la ve renombrada
  useEffect(() => {
    if (wheel.some((a) => a.key === 'espiritualidad')) {
      setWheel((prev) =>
        prev.map((a) => (a.key === 'espiritualidad' ? { ...a, key: 'retrospeccion', label: 'Retrospección' } : a)),
      );
    }
  }, [wheel, setWheel]);

  // Al crear la cuenta se reinicia el nivel si quedó el valor por defecto antiguo
  useEffect(() => {
    if (isAuthenticated && user && user.wheel_quiz_completed === false) {
      setAvatar((prev) => (prev.level === 14 ? { ...prev, level: 1, xp: 0 } : prev));
    }
  }, [isAuthenticated, user, setAvatar]);

  // La rueda del servidor manda (ya trae aplicada la baja diaria y los puntos de tareas)
  useEffect(() => {
    if (Array.isArray(user?.wheel) && user.wheel.length === INITIAL_WHEEL.length) {
      setWheel(
        INITIAL_WHEEL.map((base) => {
          const found = user.wheel.find((item) => item.key === base.key);
          return found ? { ...base, value: clamp(round1(Number(found.value) || 0), 0, 10) } : base;
        }),
      );
    }
  }, [user?.wheel]); // eslint-disable-line react-hooks/exhaustive-deps

  // Si la persona ya personalizó su avatar en otro dispositivo, se carga al iniciar sesión
  useEffect(() => {
    if (user?.avatar_look && typeof user.avatar_look === 'object' && Object.keys(user.avatar_look).length) {
      setLookState(normalizeLook(user.avatar_look));
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Guarda la apariencia del avatar (local + perfil en el servidor). */
  const setLook = useCallback(
    (nextLook) => {
      const clean = normalizeLook(nextLook);
      setLookState(clean);
      if (isAuthenticated) {
        updateProfile?.({ avatar_look: clean });
      }
    },
    [setLookState, isAuthenticated, updateProfile],
  );

  /** reward: { vida?, alimento?, carino?, xp? } — acepta negativos. */
  const applyReward = useCallback(
    (reward = {}) => {
      setAvatar((prev) => {
        const stats = { ...prev.stats };
        STAT_KEYS.forEach((k) => {
          if (reward[k]) stats[k] = clamp(stats[k] + reward[k], 0, 100);
        });
        let { level, xp } = prev;
        xp += reward.xp ?? 0;
        while (xp >= XP_PER_LEVEL) {
          xp -= XP_PER_LEVEL;
          level += 1;
        }
        xp = Math.max(0, xp);
        return { ...prev, stats, level, xp };
      });
    },
    [setAvatar],
  );

  /**
   * Suma puntos a un área al completar una tarea (tranquila +0.2, media +0.5, difícil +1).
   * Se usa para las tareas del calendario; las del Dashboard las premia el servidor al completarlas.
   */
  const awardArea = useCallback(
    async (key, difficulty) => {
      const points = WHEEL_POINTS_BY_DIFFICULTY[difficulty];
      if (!points || !INITIAL_WHEEL.some((a) => a.key === key)) return 0;
      setWheel((prev) => prev.map((a) => (a.key === key ? { ...a, value: clamp(round1(a.value + points), 0, 10) } : a)));
      if (isAuthenticated && getAuthToken()) {
        try {
          const updated = await api.post('/api/auth/me/wheel/award/', { area: key, difficulty });
          setServerUser?.(updated);
        } catch (err) {
          console.warn('No se pudieron guardar los puntos de la rueda:', err);
        }
      }
      return points;
    },
    [setWheel, isAuthenticated, setServerUser],
  );

  // El cuestionario solo aparece mientras no se haya respondido; después queda bloqueado
  const quizMandatory = Boolean(isAuthenticated && user && user.wheel_quiz_completed === false);
  const quizOpen = quizMandatory;

  const completeWheelQuiz = useCallback(
    (scoresByKey = {}) => {
      const nextWheel = INITIAL_WHEEL.map((area) => ({
        ...area,
        value: clamp(Number(scoresByKey[area.key] ?? area.value), 0, 10),
      }));
      setWheel(nextWheel);
      if (isAuthenticated) {
        updateProfile?.({
          wheel: nextWheel,
          wheel_quiz_completed: true,
        });
      }
    },
    [setWheel, isAuthenticated, updateProfile],
  );

  /**
   * Guarda la Rueda de la Vida final (se puede repetir). El servidor conserva la inicial
   * para compararlas y la rueda actual pasa a ser la final. Lanza error si no se pudo guardar.
   */
  const saveFinalWheel = useCallback(
    async (scoresByKey = {}) => {
      const nextWheel = INITIAL_WHEEL.map((area) => ({
        key: area.key,
        value: clamp(Number(scoresByKey[area.key] ?? 0), 0, 10),
      }));
      const updated = await api.post('/api/auth/me/wheel/final/', { wheel: nextWheel });
      setServerUser?.(updated);
      return updated;
    },
    [setServerUser],
  );

  const toAreas = (list) =>
    Array.isArray(list) && list.length
      ? INITIAL_WHEEL.map((base) => {
          const found = list.find((item) => item.key === base.key);
          return { ...base, value: clamp(round1(Number(found?.value) || 0), 0, 10) };
        })
      : [];
  const wheelInitial = useMemo(() => toAreas(user?.wheel_initial), [user?.wheel_initial]); // eslint-disable-line react-hooks/exhaustive-deps
  const wheelFinal = useMemo(() => toAreas(user?.wheel_final), [user?.wheel_final]); // eslint-disable-line react-hooks/exhaustive-deps
  const wheelFinalAt = user?.wheel_final_at ?? null;

  const value = useMemo(
    () => ({
      ...avatar,
      wheelInitial,
      wheelFinal,
      wheelFinalAt,
      saveFinalWheel,
      look: normalizeLook(look),
      setLook,
      wheel,
      quizOpen,
      quizMandatory,
      applyReward,
      awardArea,
      completeWheelQuiz,
      resetAvatar: () => {
        setAvatar(INITIAL_AVATAR);
        setWheel(INITIAL_WHEEL);
      },
    }),
    [
      avatar,
      wheelInitial,
      wheelFinal,
      wheelFinalAt,
      saveFinalWheel,
      look,
      setLook,
      wheel,
      quizOpen,
      quizMandatory,
      applyReward,
      awardArea,
      completeWheelQuiz,
      setAvatar,
      setWheel,
    ],
  );

  return <AvatarContext.Provider value={value}>{children}</AvatarContext.Provider>;
}

export function useAvatar() {
  const ctx = useContext(AvatarContext);
  if (!ctx) throw new Error('useAvatar debe usarse dentro de <AvatarProvider>');
  return ctx;
}
