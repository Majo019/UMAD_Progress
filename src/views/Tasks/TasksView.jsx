import { useEffect, useRef, useState } from 'react';
import { CalendarCheck, ChevronLeft, ChevronRight, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button, Card, Chip, EmptyState, IconButton, SegmentedControl } from '../../components/ui';
import { DIFFICULTY, DIFFICULTY_ORDER, EVENT_TYPES, getDifficulty, useCalendar } from '../../context';
import {
  WEEKDAYS,
  WEEKDAYS_ABBR,
  addDays,
  formatShort,
  formatWeekRange,
  fromISODate,
  getWeekDays,
  toISODate,
  todayISO,
} from '../../utils/date';
import TaskFormModal from './TaskForm';
import './tasks.css';

const VIEW_OPTIONS = [
  { value: 'dificultad', label: 'Dificultad' },
  { value: 'semanal', label: 'Semanal' },
];

const byDateTime = (a, b) => `${a.date} ${a.time ?? ''}`.localeCompare(`${b.date} ${b.time ?? ''}`);

/* ---------- Piezas compartidas ---------- */

function DifficultyDots({ events }) {
  if (!events?.length) return <span className="task-dots" />;
  return (
    <span className="task-dots" aria-hidden="true">
      {events.slice(0, 3).map((e) => (
        <span key={e.id} className={`task-dot task-dot--${DIFFICULTY[getDifficulty(e)].color}`} />
      ))}
    </span>
  );
}

function TaskItem({ event, showDate, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef(null);
  const diff = DIFFICULTY[getDifficulty(event)];
  const type = EVENT_TYPES[event.type];

  useEffect(() => {
    if (!menuOpen) return undefined;
    const close = (e) => !ref.current?.contains(e.target) && setMenuOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  return (
    <Card as="li" accent={diff.color} className="task">
      <div className="task__body">
        <p className="task__title">{event.title}</p>
        <p className="task__meta">
          {showDate && `${formatShort(fromISODate(event.date))} · `}
          {event.time}
          {event.detail && ` · ${event.detail}`}
        </p>
        <div className="task__chips">
          <Chip color={diff.color}>{diff.label}</Chip>
          {type && <Chip>{type.label}</Chip>}
        </div>
      </div>
      <div className="task__menu" ref={ref}>
        <IconButton icon={MoreVertical} label="Opciones" className="icon-btn--sm" onClick={() => setMenuOpen((o) => !o)} />
        {menuOpen && (
          <div className="dropdown" role="menu">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onEdit(event);
              }}
            >
              <Pencil size={15} /> Editar
            </button>
            <button
              type="button"
              role="menuitem"
              className="is-danger"
              onClick={() => {
                setMenuOpen(false);
                onDelete(event.id);
              }}
            >
              <Trash2 size={15} /> Eliminar
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ---------- Vista: clasificación por dificultad ---------- */

function DifficultyBoard({ events, onEdit, onDelete }) {
  const today = todayISO();
  const upcoming = events.filter((e) => e.date >= today).sort(byDateTime);
  const groups = Object.fromEntries(DIFFICULTY_ORDER.map((k) => [k, []]));
  upcoming.forEach((e) => groups[getDifficulty(e)].push(e));
  const total = upcoming.length;

  return (
    <div className="stack">
      {/* Resumen: proporción de tareas pesadas vs tranquilas */}
      <Card className="diff-summary">
        <div className="row-between">
          <h2 className="section-title">Carga pendiente</h2>
          <span className="label-mono">
            {total} tarea{total === 1 ? '' : 's'}
          </span>
        </div>
        <div className="diff-bar" role="img" aria-label={DIFFICULTY_ORDER.map((k) => `${DIFFICULTY[k].label}: ${groups[k].length}`).join(', ')}>
          {total === 0 ? (
            <span className="diff-bar__empty" />
          ) : (
            DIFFICULTY_ORDER.map((k) =>
              groups[k].length ? (
                <span
                  key={k}
                  className={`diff-bar__seg diff-bar__seg--${DIFFICULTY[k].color}`}
                  style={{ flexGrow: groups[k].length }}
                />
              ) : null,
            )
          )}
        </div>
        <ul className="diff-legend">
          {DIFFICULTY_ORDER.map((k) => (
            <li key={k}>
              <span className={`task-dot task-dot--${DIFFICULTY[k].color}`} aria-hidden="true" />
              {DIFFICULTY[k].label}
              <strong>{groups[k].length}</strong>
            </li>
          ))}
        </ul>
      </Card>

      {DIFFICULTY_ORDER.map((k) => {
        const d = DIFFICULTY[k];
        return (
          <section key={k} className={`diff-group diff-group--${d.color}`} aria-labelledby={`diff-${k}`}>
            <header className="diff-group__head">
              <span className={`diff-group__swatch diff-group__swatch--${d.color}`} aria-hidden="true" />
              <div>
                <h3 id={`diff-${k}`} className="diff-group__title">
                  {d.label}
                </h3>
                <p className="diff-group__hint">{d.hint}</p>
              </div>
              <span className="diff-group__count">{groups[k].length}</span>
            </header>
            {groups[k].length ? (
              <ul className="task-list">
                {groups[k].map((ev) => (
                  <TaskItem key={ev.id} event={ev} showDate onEdit={onEdit} onDelete={onDelete} />
                ))}
              </ul>
            ) : (
              <p className="diff-group__empty">Sin tareas en esta categoría.</p>
            )}
          </section>
        );
      })}
    </div>
  );
}

/* ---------- Vista: semanal con tareas por día ---------- */

function WeekBoard({ eventsByDate, selected, onSelectDay, onShiftWeek, onEdit, onDelete }) {
  const today = todayISO();
  const selectedDate = fromISODate(selected);
  const days = getWeekDays(selectedDate);
  const heading = formatWeekRange(selectedDate);
  const weekEvents = days.flatMap((d) => eventsByDate[toISODate(d)] ?? []);
  const counts = Object.fromEntries(DIFFICULTY_ORDER.map((k) => [k, 0]));
  weekEvents.forEach((e) => (counts[getDifficulty(e)] += 1));

  return (
    <div className="stack">
      <div className="week-nav">
        <IconButton icon={ChevronLeft} label="Semana anterior" onClick={() => onShiftWeek(-1)} />
        <h2 className="week-nav__title" aria-live="polite">
          {heading}
        </h2>
        <IconButton icon={ChevronRight} label="Semana siguiente" onClick={() => onShiftWeek(1)} />
      </div>

      <div className="week-strip" role="listbox" aria-label={heading}>
        {days.map((date, i) => {
          const iso = toISODate(date);
          const events = eventsByDate[iso];
          return (
            <button
              key={iso}
              type="button"
              role="option"
              aria-selected={iso === selected}
              className={`week-strip__day ${iso === selected ? 'is-selected' : ''} ${iso === today ? 'is-today' : ''}`}
              onClick={() => {
                onSelectDay(date);
                document.getElementById(`day-${iso}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              <span className="week-strip__name">{WEEKDAYS_ABBR[i]}</span>
              <span className="week-strip__num">{date.getDate()}</span>
              <DifficultyDots events={events} />
            </button>
          );
        })}
      </div>

      <div className="week-summary">
        <span className="label-mono">
          {weekEvents.length} tarea{weekEvents.length === 1 ? '' : 's'} esta semana
        </span>
        <span className="week-summary__chips">
          {DIFFICULTY_ORDER.map((k) =>
            counts[k] ? (
              <Chip key={k} color={DIFFICULTY[k].color}>
                {counts[k]} {DIFFICULTY[k].label.toLowerCase()}
              </Chip>
            ) : null,
          )}
        </span>
      </div>

      <ol className="week-days">
        {days.map((date, i) => {
          const iso = toISODate(date);
          const events = eventsByDate[iso] ?? [];
          return (
            <li key={iso} id={`day-${iso}`} className={`week-day ${iso === selected ? 'is-selected' : ''}`}>
              <button type="button" className="week-day__head" onClick={() => onSelectDay(date)}>
                <span className="week-day__name">{WEEKDAYS[i]}</span>
                <span className="week-day__date">{formatShort(date)}</span>
                {iso === today && <Chip color="blue">Hoy</Chip>}
              </button>
              {events.length ? (
                <ul className="task-list">
                  {events.map((ev) => (
                    <TaskItem key={ev.id} event={ev} onEdit={onEdit} onDelete={onDelete} />
                  ))}
                </ul>
              ) : (
                <p className="week-day__empty">Día libre</p>
              )}
            </li>
          );
        })}
      </ol>

      {weekEvents.length === 0 && (
        <EmptyState icon={CalendarCheck} title="Semana libre">
          No tienes tareas registradas para esta semana.
        </EmptyState>
      )}
    </div>
  );
}

/* ---------- Pantalla ---------- */

export default function TasksView() {
  const { events, eventsByDate, addEvent, updateEvent, removeEvent } = useCalendar();
  const [view, setView] = useState('dificultad');
  const [selected, setSelected] = useState(todayISO);
  const [modal, setModal] = useState(null); // null | { initial?: event }

  const selectDay = (date) => setSelected(toISODate(date));
  const shiftWeek = (dir) => selectDay(addDays(fromISODate(selected), dir * 7));

  const handleSubmit = (data) => {
    if (data.id) updateEvent(data.id, data);
    else addEvent(data);
    selectDay(fromISODate(data.date));
  };

  const openEdit = (e) => setModal({ initial: e });

  return (
    <section className="view tasks">
      <h1 className="page-title">Tareas</h1>

      <SegmentedControl options={VIEW_OPTIONS} value={view} onChange={setView} label="Tipo de vista" />

      {view === 'dificultad' ? (
        <DifficultyBoard events={events} onEdit={openEdit} onDelete={removeEvent} />
      ) : (
        <WeekBoard
          eventsByDate={eventsByDate}
          selected={selected}
          onSelectDay={selectDay}
          onShiftWeek={shiftWeek}
          onEdit={openEdit}
          onDelete={removeEvent}
        />
      )}

      <Button variant="dashed" icon={Plus} onClick={() => setModal({})}>
        Nueva tarea
      </Button>

      {modal && (
        <TaskFormModal
          key={modal.initial?.id ?? `new-${selected}`}
          open
          initial={modal.initial}
          defaultDate={selected}
          onClose={() => setModal(null)}
          onSubmit={handleSubmit}
        />
      )}
    </section>
  );
}
