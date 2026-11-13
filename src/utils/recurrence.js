/**
 * Tareas recurrentes: a partir de una fecha inicial genera las fechas en que
 * se agenda la tarea. Cada fecha se guarda como una tarea independiente, así
 * cada una se completa (y da su recompensa) por separado.
 *
 * recurrence: { repeat: 'none' | 'daily' | 'weekly', weekdays: number[] (0 = domingo), until: 'YYYY-MM-DD' }
 */

export const MAX_OCCURRENCES = 60;
export const MAX_RANGE_DAYS = 90;

export const WEEKDAYS = [
  { value: 1, short: 'L', label: 'Lunes' },
  { value: 2, short: 'M', label: 'Martes' },
  { value: 3, short: 'X', label: 'Miércoles' },
  { value: 4, short: 'J', label: 'Jueves' },
  { value: 5, short: 'V', label: 'Viernes' },
  { value: 6, short: 'S', label: 'Sábado' },
  { value: 0, short: 'D', label: 'Domingo' },
];

export const NO_RECURRENCE = { repeat: 'none', weekdays: [], until: '' };

const pad = (n) => String(n).padStart(2, '0');
const parse = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const format = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export function addDaysISO(iso, days) {
  const date = parse(iso);
  date.setDate(date.getDate() + days);
  return format(date);
}

/** Lista de fechas (YYYY-MM-DD) en que se agenda la tarea. Siempre incluye al menos `start`. */
export function expandRecurrence(start, recurrence) {
  if (!start || !recurrence || recurrence.repeat === 'none' || !recurrence.until || recurrence.until < start) {
    return start ? [start] : [];
  }
  const limit = addDaysISO(start, MAX_RANGE_DAYS);
  const end = recurrence.until < limit ? recurrence.until : limit;
  const days = new Set(recurrence.weekdays);
  const dates = [];
  for (let iso = start; iso <= end && dates.length < MAX_OCCURRENCES; iso = addDaysISO(iso, 1)) {
    if (recurrence.repeat === 'daily' || days.has(parse(iso).getDay())) dates.push(iso);
  }
  return dates;
}

/** Texto corto para mostrar la repetición ("Todos los días", "L · X · V"). */
export function describeRecurrence(recurrence) {
  if (!recurrence || recurrence.repeat === 'none') return '';
  if (recurrence.repeat === 'daily') return 'Todos los días';
  return WEEKDAYS.filter((d) => recurrence.weekdays.includes(d.value))
    .map((d) => d.short)
    .join(' · ');
}

/** Identificador para agrupar las tareas de una misma serie. */
export const newSeriesId = () => `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
