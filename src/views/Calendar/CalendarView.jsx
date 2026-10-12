import { useEffect, useRef, useState } from 'react';
import { CalendarCheck, ChevronLeft, ChevronRight, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button, Card, EmptyState, IconButton, SegmentedControl } from '../../components/ui';
import { EVENT_TYPES, useCalendar } from '../../context';
import {
  MONTHS,
  WEEKDAYS_ABBR,
  WEEKDAYS_SHORT,
  addDays,
  formatLong,
  formatShort,
  formatWeekRange,
  fromISODate,
  getMonthGrid,
  getWeekDays,
  toISODate,
  todayISO,
} from '../../utils/date';
import EventFormModal from './EventForm';
import './calendar.css';

const VIEW_OPTIONS = [
  { value: 'mensual', label: 'Mensual' },
  { value: 'semanal', label: 'Semanal' },
];

function EventDots({ events }) {
  if (!events?.length) return <span className="cal-dots" />;
  return (
    <span className="cal-dots" aria-hidden="true">
      {events.slice(0, 3).map((e) => (
        <span key={e.id} className={`cal-dot cal-dot--${EVENT_TYPES[e.type]?.color ?? 'neutral'}`} />
      ))}
    </span>
  );
}

function ActivityItem({ event, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef(null);
  const type = EVENT_TYPES[event.type] ?? EVENT_TYPES.personal;

  useEffect(() => {
    if (!menuOpen) return undefined;
    const close = (e) => !ref.current?.contains(e.target) && setMenuOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  return (
    <Card as="li" accent={type.color} className="activity">
      <div className="activity__body">
        <p className="activity__title">{event.title}</p>
        <p className="activity__meta">
          {event.time}
          {event.detail && ` - ${event.detail}`}
        </p>
      </div>
      <div className="activity__menu" ref={ref}>
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

export default function CalendarView() {
  const { eventsByDate, addEvent, updateEvent, removeEvent } = useCalendar();
  const [view, setView] = useState('mensual');
  const [selected, setSelected] = useState(todayISO);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [modal, setModal] = useState(null); // null | { initial?: event }

  const today = todayISO();
  const selectedDate = fromISODate(selected);
  const dayEvents = eventsByDate[selected] ?? [];

  const selectDay = (date) => {
    setSelected(toISODate(date));
    if (date.getMonth() !== cursor.month || date.getFullYear() !== cursor.year) {
      setCursor({ year: date.getFullYear(), month: date.getMonth() });
    }
  };

  const shift = (dir) => {
    if (view === 'mensual') {
      const d = new Date(cursor.year, cursor.month + dir, 1);
      setCursor({ year: d.getFullYear(), month: d.getMonth() });
    } else {
      selectDay(addDays(selectedDate, dir * 7));
    }
  };

  const heading = view === 'mensual' ? `${MONTHS[cursor.month]} ${cursor.year}` : formatWeekRange(selectedDate);

  const handleSubmit = (data) => {
    if (data.id) updateEvent(data.id, data);
    else addEvent(data);
    selectDay(fromISODate(data.date));
  };

  return (
    <section className="view calendar">
      <div className="cal-nav">
        <IconButton icon={ChevronLeft} label={view === 'mensual' ? 'Mes anterior' : 'Semana anterior'} onClick={() => shift(-1)} />
        <h1 className="cal-nav__title" aria-live="polite">
          {heading}
        </h1>
        <IconButton icon={ChevronRight} label={view === 'mensual' ? 'Mes siguiente' : 'Semana siguiente'} onClick={() => shift(1)} />
      </div>

      <SegmentedControl options={VIEW_OPTIONS} value={view} onChange={setView} label="Tipo de vista" />

      {view === 'mensual' ? (
        <div className="cal-month" role="grid" aria-label={heading}>
          <div className="cal-month__weekdays" role="row">
            {WEEKDAYS_SHORT.map((d) => (
              <span key={d} role="columnheader">
                {d}
              </span>
            ))}
          </div>
          {getMonthGrid(cursor.year, cursor.month).map((week) => (
            <div className="cal-month__week" role="row" key={toISODate(week[0])}>
              {week.map((date) => {
                const iso = toISODate(date);
                const outside = date.getMonth() !== cursor.month;
                const classes = [
                  'cal-day',
                  outside && 'is-outside',
                  iso === today && 'is-today',
                  iso === selected && 'is-selected',
                ]
                  .filter(Boolean)
                  .join(' ');
                const count = eventsByDate[iso]?.length ?? 0;
                return (
                  <button
                    key={iso}
                    type="button"
                    role="gridcell"
                    className={classes}
                    aria-selected={iso === selected}
                    aria-label={`${formatLong(date)}${count ? `, ${count} actividad${count > 1 ? 'es' : ''}` : ''}`}
                    onClick={() => selectDay(date)}
                  >
                    <span className="cal-day__num">{date.getDate()}</span>
                    <EventDots events={eventsByDate[iso]} />
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <div className="cal-week" role="listbox" aria-label={heading}>
          {getWeekDays(selectedDate).map((date, i) => {
            const iso = toISODate(date);
            const events = eventsByDate[iso];
            return (
              <button
                key={iso}
                type="button"
                role="option"
                aria-selected={iso === selected}
                className={`cal-week__day ${iso === selected ? 'is-selected' : ''} ${iso === today ? 'is-today' : ''}`}
                onClick={() => selectDay(date)}
              >
                <span className="cal-week__name">{WEEKDAYS_ABBR[i]}</span>
                <span className="cal-week__num">{date.getDate()}</span>
                <EventDots events={events} />
                <span className="cal-week__count">{events?.length ? events.length : '·'}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="stack">
        <div className="row-between">
          <h2 className="section-title">Actividades Importantes</h2>
          <span className="cal-selected-label">{formatShort(selectedDate)}</span>
        </div>

        {dayEvents.length ? (
          <ul className="activity-list">
            {dayEvents.map((ev) => (
              <ActivityItem key={ev.id} event={ev} onEdit={(e) => setModal({ initial: e })} onDelete={removeEvent} />
            ))}
          </ul>
        ) : (
          <EmptyState icon={CalendarCheck} title="Día libre">
            No tienes actividades para el {formatLong(selectedDate).toLowerCase()}.
          </EmptyState>
        )}

        <Button variant="dashed" icon={Plus} onClick={() => setModal({})}>
          Nueva actividad
        </Button>
      </div>

      {modal && (
        <EventFormModal
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
