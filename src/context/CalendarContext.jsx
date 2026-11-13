import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { usePersistentState } from '../hooks/usePersistentState';
import { useAvatar } from './AvatarContext';
import { describeRecurrence, expandRecurrence, newSeriesId } from '../utils/recurrence';

/**
 * CalendarContext
 * Tareas y actividades (entregas, exámenes, reuniones, bloques de estudio).
 * Evento: { id, title, date: 'YYYY-MM-DD', time: 'HH:MM', detail, type, difficulty, area,
 *           completed, completedAt, pointsAwarded, rewarded, seriesId?, repeatLabel? }
 * Al completarla, su área de la rueda sube según la dificultad y el personaje recibe
 * vida, alimento, cariño y XP (solo la primera vez).
 * Las tareas recurrentes se guardan como una tarea por fecha, unidas por `seriesId`.
 * difficulty: 'dificil' | 'media' | 'tranquila' — define el color de la tarea.
 */

/** Clasificación por dificultad, de la más pesada a la más tranquila. */
export const DIFFICULTY = {
  dificil: { label: 'Difícil', color: 'coral', hint: 'Requiere mucho tiempo o concentración' },
  media: { label: 'Media', color: 'amber', hint: 'Esfuerzo moderado' },
  tranquila: { label: 'Tranquila', color: 'green', hint: 'Rápida o ligera' },
};
export const DIFFICULTY_ORDER = ['dificil', 'media', 'tranquila'];

// Para eventos guardados antes de que existiera `difficulty`
const DEFAULT_DIFFICULTY_BY_TYPE = {
  examen: 'dificil',
  entrega: 'dificil',
  estudio: 'media',
  reunion: 'media',
  personal: 'tranquila',
};

export function getDifficulty(event) {
  if (DIFFICULTY[event.difficulty]) return event.difficulty;
  return DEFAULT_DIFFICULTY_BY_TYPE[event.type] ?? 'media';
}

export const EVENT_TYPES = {
  entrega: { label: 'Entrega', color: 'coral' },
  examen: { label: 'Examen', color: 'amber' },
  reunion: { label: 'Reunión', color: 'blue' },
  estudio: { label: 'Bloque de estudio', color: 'green' },
  personal: { label: 'Personal', color: 'neutral' },
};

/**
 * Los eventos de ejemplo (e1–e9) ya no se generan. Esta lista sirve para limpiar
 * a quienes los tenían guardados en el navegador de versiones anteriores.
 */
const LEGACY_SEED_EVENTS = {
  e1: 'Entrega de Proyecto',
  e2: 'Reunión de Equipo',
  e3: 'Bloque de estudio: Bases de Datos',
  e4: 'Examen parcial de Cálculo',
  e5: 'Entrega reporte de lectura',
  e6: 'Asesoría con el profe',
  e7: 'Partido de fútbol',
  e8: 'Entrega final de Frontend',
  e9: 'Sesión de estudio en grupo',
};

const isLegacySeedEvent = (event) => LEGACY_SEED_EVENTS[event?.id] === event?.title;

const byTime = (a, b) => (a.time || '').localeCompare(b.time || '');

const CalendarContext = createContext(null);

export function CalendarProvider({ children }) {
  const [events, setEvents] = usePersistentState('up:events', []);
  const { awardArea, rewardTaskCompletion } = useAvatar();

  // Borra los eventos de ejemplo que hayan quedado guardados en este navegador
  useEffect(() => {
    if (events.some(isLegacySeedEvent)) {
      setEvents((prev) => prev.filter((e) => !isLegacySeedEvent(e)));
    }
  }, [events, setEvents]);

  /** Agrega una tarea; con `recurrence` se agenda una copia por cada fecha de la serie. */
  const addEvent = useCallback(
    (event, recurrence) => {
      const dates = expandRecurrence(event.date, recurrence);
      const stamp = Date.now();
      if (dates.length <= 1) {
        setEvents((prev) => [...prev, { ...event, id: `e-${stamp}` }]);
        return;
      }
      const seriesId = newSeriesId();
      const repeatLabel = describeRecurrence(recurrence);
      setEvents((prev) => [
        ...prev,
        ...dates.map((date, i) => ({ ...event, date, id: `e-${stamp}-${i}`, seriesId, repeatLabel })),
      ]);
    },
    [setEvents],
  );

  const updateEvent = useCallback(
    (id, patch) => setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e))),
    [setEvents],
  );

  const removeEvent = useCallback(
    (id) => setEvents((prev) => prev.filter((e) => e.id !== id)),
    [setEvents],
  );

  /** Borra las tareas pendientes de una serie recurrente (las completadas se quedan en el historial). */
  const removeSeries = useCallback(
    (seriesId) => setEvents((prev) => prev.filter((e) => e.seriesId !== seriesId || e.completed)),
    [setEvents],
  );

  const completeEvent = useCallback(
    (id) => {
      const event = events.find((e) => e.id === id);
      if (!event || event.completed) return;
      const shouldAward = Boolean(event.area) && !event.pointsAwarded;
      const shouldReward = !event.rewarded;
      setEvents((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                ...e,
                completed: true,
                completedAt: new Date().toISOString(),
                pointsAwarded: e.pointsAwarded || shouldAward,
                rewarded: true,
              }
            : e,
        ),
      );
      if (shouldAward) awardArea(event.area, getDifficulty(event));
      if (shouldReward) rewardTaskCompletion({ sync: true });
    },
    [events, setEvents, awardArea, rewardTaskCompletion],
  );

  const reopenEvent = useCallback(
    (id) => setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, completed: false, completedAt: null } : e))),
    [setEvents],
  );

  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach((e) => {
      (map[e.date] ??= []).push(e);
    });
    Object.values(map).forEach((list) => list.sort(byTime));
    return map;
  }, [events]);

  const value = useMemo(
    () => ({
      events,
      eventsByDate,
      getEventsForDate: (iso) => eventsByDate[iso] ?? [],
      addEvent,
      updateEvent,
      removeEvent,
      removeSeries,
      completeEvent,
      reopenEvent,
      resetEvents: () => setEvents([]),
    }),
    [events, eventsByDate, addEvent, updateEvent, removeEvent, removeSeries, completeEvent, reopenEvent, setEvents],
  );

  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>;
}

export function useCalendar() {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error('useCalendar debe usarse dentro de <CalendarProvider>');
  return ctx;
}
