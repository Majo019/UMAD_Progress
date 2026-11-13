import { Repeat } from 'lucide-react';
import { Field } from '../ui';
import { MAX_OCCURRENCES, MAX_RANGE_DAYS, WEEKDAYS, addDaysISO, expandRecurrence } from '../../utils/recurrence';
import './RecurrenceFields.css';

const weekdayOf = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
};

/**
 * Opción "Repetir" del formulario de nueva tarea (ej. meditar todos los días).
 * `start` es la fecha de la tarea; sin fecha no se puede repetir.
 */
export default function RecurrenceFields({ start, value, onChange }) {
  const set = (patch) => onChange({ ...value, ...patch });

  const changeRepeat = (repeat) => {
    if (repeat === 'none') return onChange({ repeat, weekdays: [], until: '' });
    const until = value.until && start && value.until >= start ? value.until : start ? addDaysISO(start, 6) : '';
    const weekdays = value.weekdays.length || !start ? value.weekdays : [weekdayOf(start)];
    return onChange({ repeat, weekdays, until });
  };

  const toggleDay = (day) =>
    set({ weekdays: value.weekdays.includes(day) ? value.weekdays.filter((d) => d !== day) : [...value.weekdays, day] });

  const dates = expandRecurrence(start, value);
  const repeating = value.repeat !== 'none';

  return (
    <fieldset className="recurrence">
      <legend className="field__label recurrence__legend">
        <Repeat size={14} aria-hidden="true" /> Repetir
      </legend>

      <select
        className="input"
        value={value.repeat}
        onChange={(e) => changeRepeat(e.target.value)}
        disabled={!start}
        aria-label="Repetir tarea"
      >
        <option value="none">No se repite</option>
        <option value="daily">Todos los días</option>
        <option value="weekly">Algunos días de la semana</option>
      </select>
      {!start && <p className="recurrence__hint">Elige una fecha para poder repetir la tarea.</p>}

      {repeating && value.repeat === 'weekly' && (
        <div className="recurrence__days" role="group" aria-label="Días de la semana">
          {WEEKDAYS.map((d) => {
            const on = value.weekdays.includes(d.value);
            return (
              <button
                key={d.value}
                type="button"
                className={`recurrence__day ${on ? 'is-on' : ''}`}
                aria-pressed={on}
                aria-label={d.label}
                title={d.label}
                onClick={() => toggleDay(d.value)}
              >
                {d.short}
              </button>
            );
          })}
        </div>
      )}

      {repeating && start && (
        <>
          <Field
            label="Repetir hasta"
            type="date"
            value={value.until}
            min={start}
            max={addDaysISO(start, MAX_RANGE_DAYS)}
            onChange={(e) => set({ until: e.target.value })}
            required
          />
          <p className="recurrence__hint" aria-live="polite">
            {value.repeat === 'weekly' && !value.weekdays.length
              ? 'Elige al menos un día de la semana.'
              : dates.length > 1
              ? `Se agendarán ${dates.length} tareas, una por día${dates.length >= MAX_OCCURRENCES ? ` (máximo ${MAX_OCCURRENCES})` : ''}. Cada una da su recompensa al completarla.`
              : 'Con estas opciones solo se agenda una tarea.'}
          </p>
        </>
      )}
    </fieldset>
  );
}
