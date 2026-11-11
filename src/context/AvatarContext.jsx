import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { usePersistentState } from '../hooks/usePersistentState';
import { useAuth } from './AuthContext';
import { DEFAULT_LOOK, normalizeLook } from '../components/avatar/sprites';

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
const INITIAL_WHEEL = [
  { key: 'amigos', label: 'Amigos', value: 5 },
  { key: 'trabajo', label: 'Trabajo', value: 5 },
  { key: 'familia', label: 'Familia', value: 5 },
  { key: 'deporte', label: 'Deporte', value: 5 },
  { key: 'economia', label: 'Economía', value: 5 },
  { key: 'retrospeccion', label: 'Retrospección', value: 5 },
  { key: 'ocio', label: 'Ocio', value: 5 },
  { key: 'alimentacion', label: 'Alimentación', value: 5 },
];

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

const AvatarContext = createContext(null);

export function AvatarProvider({ children }) {
  const { user, isAuthenticated, updateProfile } = useAuth();
  const [avatar, setAvatar] = usePersistentState('up:avatar', INITIAL_AVATAR);
  const [wheel, setWheel] = usePersistentState('up:wheel', INITIAL_WHEEL);
  const [quizOpen, setQuizOpen] = usePersistentState('up:wheelQuizPending', false);
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

  // Si el usuario recién creó su cuenta (wheel_quiz_completed === false), abrir el cuestionario emergente
  useEffect(() => {
    if (isAuthenticated && user && user.wheel_quiz_completed === false) {
      setQuizOpen(true);
      setAvatar((prev) => (prev.level === 14 ? { ...prev, level: 1, xp: 0 } : prev));
    }
  }, [isAuthenticated, user, setQuizOpen, setAvatar]);

  // Sincronizar rueda guardada en el perfil del usuario si existe
  useEffect(() => {
    if (Array.isArray(user?.wheel) && user.wheel.length === INITIAL_WHEEL.length) {
      setWheel(
        INITIAL_WHEEL.map((base) => {
          const found = user.wheel.find((item) => item.key === base.key);
          return found ? { ...base, value: clamp(Number(found.value) || 0, 0, 10) } : base;
        }),
      );
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const setWheelValue = useCallback(
    (key, value) => {
      setWheel((prev) => {
        const next = prev.map((a) => (a.key === key ? { ...a, value: clamp(value, 0, 10) } : a));
        if (isAuthenticated) {
          updateProfile?.({ wheel: next });
        }
        return next;
      });
    },
    [setWheel, isAuthenticated, updateProfile],
  );

  const boostArea = useCallback(
    (key, amount = 1) => {
      setWheel((prev) => {
        const next = prev.map((a) => (a.key === key ? { ...a, value: clamp(a.value + amount, 0, 10) } : a));
        if (isAuthenticated) {
          updateProfile?.({ wheel: next });
        }
        return next;
      });
    },
    [setWheel, isAuthenticated, updateProfile],
  );

  const openWheelQuiz = useCallback(() => {
    setQuizOpen(true);
  }, [setQuizOpen]);

  // El primer diagnóstico (usuario nuevo / recién iniciado) es obligatorio: no se puede cerrar ni omitir
  const quizMandatory = Boolean(isAuthenticated && user && user.wheel_quiz_completed === false);

  const closeWheelQuiz = useCallback(() => {
    if (quizMandatory) return;
    setQuizOpen(false);
    if (isAuthenticated && user?.wheel_quiz_completed === false) {
      updateProfile?.({ wheel_quiz_completed: true });
    }
  }, [quizMandatory, setQuizOpen, isAuthenticated, user?.wheel_quiz_completed, updateProfile]);

  const completeWheelQuiz = useCallback(
    (scoresByKey = {}) => {
      const nextWheel = INITIAL_WHEEL.map((area) => ({
        ...area,
        value: clamp(Number(scoresByKey[area.key] ?? area.value), 0, 10),
      }));
      setWheel(nextWheel);
      setQuizOpen(false);
      if (isAuthenticated) {
        updateProfile?.({
          wheel: nextWheel,
          wheel_quiz_completed: true,
        });
      }
    },
    [setWheel, setQuizOpen, isAuthenticated, updateProfile],
  );

  const value = useMemo(
    () => ({
      ...avatar,
      look: normalizeLook(look),
      setLook,
      wheel,
      quizOpen,
      quizMandatory,
      applyReward,
      setWheelValue,
      boostArea,
      openWheelQuiz,
      closeWheelQuiz,
      completeWheelQuiz,
      resetAvatar: () => {
        setAvatar(INITIAL_AVATAR);
        setWheel(INITIAL_WHEEL);
      },
    }),
    [
      avatar,
      look,
      setLook,
      wheel,
      quizOpen,
      quizMandatory,
      applyReward,
      setWheelValue,
      boostArea,
      openWheelQuiz,
      closeWheelQuiz,
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
