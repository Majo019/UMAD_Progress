import { createContext, useCallback, useContext, useMemo } from 'react';
import { usePersistentState } from '../hooks/usePersistentState';

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
  level: 14,
  xp: 40,
  stats: { vida: 85, alimento: 62, carino: 90 },
};

// Orden en sentido horario empezando arriba (como en el mockup)
const INITIAL_WHEEL = [
  { key: 'amigos', label: 'Amigos', value: 8 },
  { key: 'trabajo', label: 'Trabajo', value: 6 },
  { key: 'familia', label: 'Familia', value: 7 },
  { key: 'deporte', label: 'Deporte', value: 5 },
  { key: 'economia', label: 'Economía', value: 4 },
  { key: 'espiritualidad', label: 'Espiritualidad', value: 6 },
  { key: 'ocio', label: 'Ocio', value: 7 },
  { key: 'alimentacion', label: 'Alimentación', value: 6 },
];

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

const AvatarContext = createContext(null);

export function AvatarProvider({ children }) {
  const [avatar, setAvatar] = usePersistentState('up:avatar', INITIAL_AVATAR);
  const [wheel, setWheel] = usePersistentState('up:wheel', INITIAL_WHEEL);

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
      setWheel((prev) => prev.map((a) => (a.key === key ? { ...a, value: clamp(value, 0, 10) } : a)));
    },
    [setWheel],
  );

  const boostArea = useCallback(
    (key, amount = 1) => {
      setWheel((prev) => prev.map((a) => (a.key === key ? { ...a, value: clamp(a.value + amount, 0, 10) } : a)));
    },
    [setWheel],
  );

  const value = useMemo(
    () => ({
      ...avatar,
      wheel,
      applyReward,
      setWheelValue,
      boostArea,
      resetAvatar: () => {
        setAvatar(INITIAL_AVATAR);
        setWheel(INITIAL_WHEEL);
      },
    }),
    [avatar, wheel, applyReward, setWheelValue, boostArea, setAvatar, setWheel],
  );

  return <AvatarContext.Provider value={value}>{children}</AvatarContext.Provider>;
}

export function useAvatar() {
  const ctx = useContext(AvatarContext);
  if (!ctx) throw new Error('useAvatar debe usarse dentro de <AvatarProvider>');
  return ctx;
}
