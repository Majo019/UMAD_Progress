import { useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, CircleDashed, MinusCircle, TrendingDown, TrendingUp } from 'lucide-react';
import { Card, Chip } from '../../components/ui';
import { DIFFICULTY, WHEEL_AREAS, formatWheelValue } from '../../context';
import { PROGRESS_STATUS, buildWheelFeedback } from '../../utils/wheelFeedback';

const formatDelta = (d) => (d > 0 ? `+${formatWheelValue(d)}` : d < 0 ? `−${formatWheelValue(-d)}` : '0');

const formatDate = (iso) =>
  iso ? new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso)) : '';

/** Gráfica de pesas: una fila por área, aro = inicial, punto relleno = final, escala 0–10. */
function DumbbellChart({ rows }) {
  return (
    <figure className="wheel-cmp__chart">
      <figcaption className="wheel-cmp__legend">
        <span>
          <span className="wheel-cmp__key wheel-cmp__key--initial" aria-hidden="true" /> Inicial
        </span>
        <span>
          <span className="wheel-cmp__key wheel-cmp__key--final" aria-hidden="true" /> Final
        </span>
        <span className="wheel-cmp__scale">escala 0–10</span>
      </figcaption>
      <table className="wheel-cmp__table">
        <thead className="sr-only">
          <tr>
            <th>Área</th>
            <th>Inicial y final</th>
            <th>Diferencia</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const lo = Math.min(r.initial, r.final) * 10;
            const hi = Math.max(r.initial, r.final) * 10;
            const dir = r.delta > 0 ? 'up' : r.delta < 0 ? 'down' : 'flat';
            const tip = `${r.label}: inicial ${formatWheelValue(r.initial)}, final ${formatWheelValue(r.final)} (${formatDelta(r.delta)})`;
            return (
              <tr key={r.key} className="wheel-cmp__row" title={tip} tabIndex={0} aria-label={tip}>
                <th scope="row" className="wheel-cmp__label">
                  {r.label}
                </th>
                <td className="wheel-cmp__track-cell">
                  <div className="wheel-cmp__track">
                    <span className={`wheel-cmp__bar wheel-cmp__bar--${dir}`} style={{ left: `${lo}%`, width: `${hi - lo}%` }} />
                    <span className="wheel-cmp__dot wheel-cmp__dot--initial" style={{ left: `${r.initial * 10}%` }} />
                    <span className="wheel-cmp__dot wheel-cmp__dot--final" style={{ left: `${r.final * 10}%` }} />
                  </div>
                </td>
                <td className="wheel-cmp__values">
                  {formatWheelValue(r.initial)} → <strong>{formatWheelValue(r.final)}</strong>
                  <span className={`wheel-cmp__delta wheel-cmp__delta--${dir}`}>{formatDelta(r.delta)}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </figure>
  );
}

function TaskList({ title, tasks, icon: Icon, empty }) {
  return (
    <div className="wheel-fb__tasks">
      <p className="wheel-fb__tasks-title">
        <Icon size={14} aria-hidden="true" /> {title} ({tasks.length})
      </p>
      {tasks.length ? (
        <ul>
          {tasks.map((t) => (
            <li key={t.uid}>
              {t.title}
              <span className="wheel-fb__tasks-diff">{DIFFICULTY[t.difficulty]?.label}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="wheel-fb__tasks-empty">{empty}</p>
      )}
    </div>
  );
}

function AreaFeedback({ row, open, onToggle }) {
  const status = PROGRESS_STATUS[row.status];
  return (
    <li className={`wheel-fb ${open ? 'is-open' : ''}`}>
      <button type="button" className="wheel-fb__head" aria-expanded={open} onClick={onToggle}>
        <span className="wheel-fb__name">{row.label}</span>
        <Chip color={status.color}>{status.label}</Chip>
        {row.noActivity && <Chip>Sin actividad</Chip>}
        <span className="wheel-fb__delta">{formatDelta(row.delta)}</span>
        <ChevronDown size={16} className="wheel-fb__chevron" aria-hidden="true" />
      </button>
      {open && (
        <div className="wheel-fb__body">
          <p className="wheel-fb__headline">{row.headline}</p>
          {row.comments.map((c) => (
            <p key={c} className="wheel-fb__comment">
              {c}
            </p>
          ))}
          <div className="wheel-fb__grid">
            <TaskList title="Completadas" icon={CheckCircle2} tasks={row.completed} empty="Ninguna tarea completada." />
            <TaskList title="Sin completar" icon={CircleDashed} tasks={row.pending} empty="Nada pendiente." />
          </div>
        </div>
      )}
    </li>
  );
}

export default function WheelComparison({ initial, final, finalAt, tasks }) {
  const [openKey, setOpenKey] = useState(null);
  const { areas, summary } = useMemo(
    () => buildWheelFeedback({ areas: WHEEL_AREAS, initial, final, tasks }),
    [initial, final, tasks],
  );
  const up = summary.averageDelta > 0;

  return (
    <Card className="wheel-cmp">
      <div className="row-between">
        <h2 className="wheel-card__title">Rueda inicial vs. final</h2>
        {finalAt && <span className="label-mono">{formatDate(finalAt)}</span>}
      </div>

      {/* Resumen general */}
      <div className="wheel-cmp__stats">
        <div className="wheel-cmp__stat">
          <span className="wheel-cmp__stat-label">Balance general</span>
          <span className="wheel-cmp__stat-value">
            {formatWheelValue(summary.averageInitial)} → {formatWheelValue(summary.averageFinal)}
          </span>
          <span className={`wheel-cmp__stat-sub ${up ? 'is-up' : summary.averageDelta < 0 ? 'is-down' : ''}`}>
            {up ? <TrendingUp size={14} /> : summary.averageDelta < 0 ? <TrendingDown size={14} /> : <MinusCircle size={14} />}
            {formatDelta(summary.averageDelta)} puntos
          </span>
        </div>
        <div className="wheel-cmp__stat">
          <span className="wheel-cmp__stat-label">Tareas</span>
          <span className="wheel-cmp__stat-value">{summary.completedCount} completadas</span>
          <span className="wheel-cmp__stat-sub">{summary.pendingCount} sin completar</span>
        </div>
      </div>

      <DumbbellChart rows={areas} />

      {/* Conclusión general */}
      <div className="wheel-cmp__conclusion">
        {summary.best && (
          <p>
            <strong>Mayor avance:</strong> {summary.best.label} ({formatDelta(summary.best.delta)}).
          </p>
        )}
        {summary.worst && (
          <p>
            <strong>Requiere atención:</strong> {summary.worst.label} ({formatDelta(summary.worst.delta)}).
          </p>
        )}
        <p>
          <strong>Áreas sin registro de actividades:</strong>{' '}
          {summary.withoutActivity.length
            ? summary.withoutActivity.map((r) => r.label).join(', ')
            : 'ninguna, registraste actividad en todas tus áreas.'}
        </p>
      </div>

      {/* Retroalimentación por área */}
      <h3 className="section-title">Retroalimentación por área</h3>
      <ul className="wheel-fb-list">
        {areas.map((row) => (
          <AreaFeedback
            key={row.key}
            row={row}
            open={openKey === row.key}
            onToggle={() => setOpenKey((k) => (k === row.key ? null : row.key))}
          />
        ))}
      </ul>
    </Card>
  );
}
