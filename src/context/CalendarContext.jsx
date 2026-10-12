import { createContext, useCallback, useContext, useMemo } from 'react';
import { usePersistentState } from '../hooks/usePersistentState';
import { addDays, toISODate } from '../utils/date';

/**
 * CalendarContext
 * Actividades del calendario (entregas, exámenes, reuniones, bloques de estudio).
 * Evento: { id, title, date: 'YYYY-MM-DD', time: 'HH:MM', detail, type }
 */

export const EVENT_TYPES = {
  entrega: { label: 'Entrega', color: 'coral' },
  examen: { label: 'Examen', color: 'amber' },
  reunion: { label: 'Reunión', color: 'blue' },
  estudio: { label: 'Bloque de estudio', color: 'green' },
  personal: { label: 'Personal', color: 'neutral' },
};

function seedEvents() {
  const t = new Date();
  const d = (offset) => toISODate(addDays(t, offset));
  return [
    { id: 'e1', title: 'Entrega de Proyecto', date: d(0), time: '14:00', detail: 'UI/UX Avanzado', type: 'entrega' },
    { id: 'e2', title: 'Reunión de Equipo', date: d(0), time: '16:30', detail: 'Sala Virtual B', type: 'reunion' },
    { id: 'e3', title: 'Bloque de estudio: Bases de Datos', date: d(1), time: '10:00', detail: 'Biblioteca', type: 'estudio' },
    { id: 'e4', title: 'Examen parcial de Cálculo', date: d(3), time: '08:00', detail: 'Aula 204', type: 'examen' },
    { id: 'e5', title: 'Entrega reporte de lectura', date: d(6), time: '23:59', detail: 'Ética Profesional', type: 'entrega' },
    { id: 'e6', title: 'Asesoría con el profe', date: d(8), time: '12:00', detail: 'Cubículo 3', type: 'reunion' },
    { id: 'e7', title: 'Partido de fútbol', date: d(10), time: '18:00', detail: 'Cancha UMAD', type: 'personal' },
    { id: 'e8', title: 'Entrega final de Frontend', date: d(13), time: '09:00', detail: 'Ingeniería de Software', type: 'entrega' },
    { id: 'e9', title: 'Sesión de estudio en grupo', date: d(-3), time: '17:00', detail: 'Sala Virtual A', type: 'estudio' },
  ];
}

const byTime = (a, b) => (a.time || '').localeCompare(b.time || '');

const CalendarContext = createContext(null);

export function CalendarProvider({ children }) {
  const [events, setEvents] = usePersistentState('up:events', seedEvents);

  const addEvent = useCallback(
    (event) => setEvents((prev) => [...prev, { ...event, id: `e-${Date.now()}` }]),
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
      resetEvents: () => setEvents(seedEvents()),
    }),
    [events, eventsByDate, addEvent, updateEvent, removeEvent, setEvents],
  );

  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>;
}

export function useCalendar() {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error('useCalendar debe usarse dentro de <CalendarProvider>');
  return ctx;
}
