// Utilidades de fechas (semana inicia en lunes, formato ISO local YYYY-MM-DD)

export const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
export const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
export const WEEKDAYS_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
export const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
export const WEEKDAYS_ABBR = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const pad = (n) => String(n).padStart(2, '0');

export function toISODate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO() {
  return toISODate(new Date());
}

export function addDays(date, amount) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() + amount);
  return result;
}

/** Índice 0 = lunes ... 6 = domingo */
export function weekdayIndex(date) {
  return (date.getDay() + 6) % 7;
}

export function startOfWeek(date) {
  return addDays(date, -weekdayIndex(date));
}

export function getWeekDays(date) {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Devuelve las semanas (arreglos de 7 fechas) que cubren el mes. */
export function getMonthGrid(year, month) {
  const start = startOfWeek(new Date(year, month, 1));
  const weeks = [];
  for (let w = 0; w < 6; w++) {
    const week = Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d));
    if (week.some((day) => day.getMonth() === month)) weeks.push(week);
  }
  return weeks;
}

export function formatShort(date) {
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

export function formatLong(date) {
  return `${WEEKDAYS[weekdayIndex(date)]} ${date.getDate()} de ${MONTHS[date.getMonth()].toLowerCase()}`;
}

export function formatWeekRange(date) {
  const days = getWeekDays(date);
  const first = days[0];
  const last = days[6];
  if (first.getMonth() === last.getMonth()) {
    return `${first.getDate()} – ${last.getDate()} ${MONTHS_SHORT[last.getMonth()]} ${last.getFullYear()}`;
  }
  return `${formatShort(first)} – ${formatShort(last)} ${last.getFullYear()}`;
}
