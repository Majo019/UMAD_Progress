import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, LineChart, TrendingDown, TrendingUp } from 'lucide-react';
import { Card, EmptyState } from '../../components/ui';
import { WHEEL_AREAS, formatWheelValue, useAvatar } from '../../context';
import { api } from '../../utils/api';
import LifeWheel from './LifeWheel';

/**
 * Historial de Ruedas de la Vida: lista de cada rueda respondida (con su fecha),
 * vista de la rueda seleccionada y gráficas con la variación de cada métrica.
 */

const AVERAGE = 'promedio';
const METRICS = [{ key: AVERAGE, label: 'Balance general' }, ...WHEEL_AREAS.map(({ key, label }) => ({ key, label }))];

const fmtDate = (iso, opts = { day: '2-digit', month: 'short', year: 'numeric' }) =>
  new Intl.DateTimeFormat('es-MX', opts).format(new Date(iso));
const fmtShort = (iso) => fmtDate(iso, { day: '2-digit', month: 'short' });
const fmtDelta = (d) => (d > 0 ? `+${formatWheelValue(d)}` : d < 0 ? `−${formatWheelValue(-d)}` : '0');

const toAreas = (wheel) =>
  WHEEL_AREAS.map((base) => {
    const found = wheel?.find((a) => a.key === base.key);
    return { key: base.key, label: base.label, value: Number(found?.value) || 0 };
  });

const metricValue = (areas, key) =>
  key === AVERAGE
    ? Math.round((areas.reduce((s, a) => s + a.value, 0) / areas.length) * 10) / 10
    : areas.find((a) => a.key === key)?.value ?? 0;

const snapshotName = (s, i) => (s.kind === 'initial' ? 'Rueda inicial' : `Rueda ${i + 1}`);

/* ---------- Gráfica de línea (una métrica, escala fija 0–10) ---------- */

const LW = 360;
const LH = 180;
const PAD = { top: 14, right: 16, bottom: 28, left: 28 };

function MetricLineChart({ points, label }) {
  const [hover, setHover] = useState(null);
  const iw = LW - PAD.left - PAD.right;
  const ih = LH - PAD.top - PAD.bottom;
  const x = (i) => PAD.left + (points.length === 1 ? iw / 2 : (iw * i) / (points.length - 1));
  const y = (v) => PAD.top + ih - (ih * v) / 10;
  const solid = points.filter((p) => !p.live);
  const live = points.find((p) => p.live);
  const path = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.index)} ${y(p.value)}`).join(' ');
  const labelEvery = Math.ceil(points.length / 5);
  const active = hover != null ? points[hover] : null;

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * LW;
    let best = 0;
    points.forEach((p, i) => {
      if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i;
    });
    setHover(best);
  };

  return (
    <div className="wheel-hist__line">
      <svg
        viewBox={`0 0 ${LW} ${LH}`}
        role="img"
        aria-label={`Variación de ${label} en cada rueda`}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        {[0, 5, 10].map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={LW - PAD.right} y1={y(v)} y2={y(v)} className="wheel-hist__grid" />
            <text x={PAD.left - 8} y={y(v) + 4} textAnchor="end" className="wheel-hist__tick">
              {v}
            </text>
          </g>
        ))}
        {points.map((p, i) =>
          i % labelEvery === 0 || i === points.length - 1 ? (
            <text key={p.id} x={x(i)} y={LH - 8} textAnchor="middle" className="wheel-hist__tick">
              {p.live ? 'Hoy' : fmtShort(p.date)}
            </text>
          ) : null,
        )}
        {active && <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + ih} className="wheel-hist__cross" />}
        {solid.length > 1 && <path d={path(solid)} className="wheel-hist__path" />}
        {live && solid.length > 0 && <path d={path([solid[solid.length - 1], live])} className="wheel-hist__path is-live" />}
        {points.map((p, i) => (
          <circle
            key={p.id}
            cx={x(i)}
            cy={y(p.value)}
            r={hover === i ? 6 : 4.5}
            className={`wheel-hist__dot ${p.live ? 'is-live' : ''}`}
          />
        ))}
      </svg>
      {active && (
        <div
          className="wheel-hist__tooltip"
          style={{ left: `${(x(hover) / LW) * 100}%`, top: `${(y(active.value) / LH) * 100}%` }}
          role="status"
        >
          <span className="wheel-hist__tooltip-title">{active.name}</span>
          <span>{active.live ? 'Valor actual' : fmtDate(active.date)}</span>
          <strong>
            {label}: {formatWheelValue(active.value)}/10
          </strong>
          {hover > 0 && <span>{fmtDelta(active.value - points[hover - 1].value)} vs. anterior</span>}
        </div>
      )}
    </div>
  );
}

/* ---------- Mini gráfica por área (small multiples) ---------- */

const SW = 120;
const SH = 36;

function Sparkline({ values }) {
  const x = (i) => (values.length === 1 ? SW / 2 : 4 + ((SW - 8) * i) / (values.length - 1));
  const y = (v) => 4 + (SH - 8) * (1 - v / 10);
  return (
    <svg viewBox={`0 0 ${SW} ${SH}`} className="wheel-hist__spark" aria-hidden="true" preserveAspectRatio="none">
      <line x1="0" x2={SW} y1={y(5)} y2={y(5)} className="wheel-hist__grid" />
      {values.length > 1 && (
        <path d={values.map((v, i) => `${i ? 'L' : 'M'}${x(i)} ${y(v)}`).join(' ')} className="wheel-hist__path" />
      )}
      <circle cx={x(values.length - 1)} cy={y(values[values.length - 1])} r="3" className="wheel-hist__dot" />
    </svg>
  );
}

/* ---------- Módulo ---------- */

export default function WheelHistory() {
  const { wheel, wheelFinalAt } = useAvatar();
  const [snapshots, setSnapshots] = useState(null);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [metric, setMetric] = useState(AVERAGE);
  const [includeLive, setIncludeLive] = useState(true);

  // Se vuelve a pedir cada vez que se rehace la rueda (cambia wheelFinalAt)
  useEffect(() => {
    let alive = true;
    api
      .get('/api/auth/me/wheel/history/')
      .then((data) => {
        if (!alive) return;
        const list = (Array.isArray(data) ? data : []).map((s) => ({ ...s, areas: toAreas(s.wheel) }));
        setSnapshots(list);
        setSelectedId(list.length ? list[list.length - 1].id : null);
        setError('');
      })
      .catch(() => alive && setError('No se pudo cargar el historial de ruedas.'));
    return () => {
      alive = false;
    };
  }, [wheelFinalAt]);

  const liveAreas = useMemo(() => toAreas(wheel), [wheel]);

  const series = useMemo(() => {
    if (!snapshots?.length) return [];
    const rows = snapshots.map((s, i) => ({ id: s.id, name: snapshotName(s, i), date: s.created_at, areas: s.areas }));
    if (includeLive) rows.push({ id: 'live', name: 'Rueda actual', date: null, areas: liveAreas, live: true });
    return rows;
  }, [snapshots, includeLive, liveAreas]);

  if (error) {
    return (
      <Card className="wheel-hist">
        <h2 className="wheel-card__title">
          <CalendarClock size={20} aria-hidden="true" /> Historial de ruedas
        </h2>
        <p className="wheel-card__final-error" role="alert">
          {error}
        </p>
      </Card>
    );
  }
  if (!snapshots) return null;

  const selectedIndex = snapshots.findIndex((s) => s.id === selectedId);
  const selected = snapshots[selectedIndex];
  const metricLabel = METRICS.find((m) => m.key === metric)?.label;
  const points = series.map((row, index) => ({ ...row, index, value: metricValue(row.areas, metric) }));

  return (
    <Card className="wheel-hist wheel-card">
      <div className="row-between">
        <h2 className="wheel-card__title">
          <CalendarClock size={20} aria-hidden="true" /> Historial de ruedas
        </h2>
        <span className="label-mono">{snapshots.length} registradas</span>
      </div>

      {!snapshots.length ? (
        <EmptyState title="Aún no hay ruedas guardadas">Responde el cuestionario para empezar tu historial.</EmptyState>
      ) : (
        <>
          {/* Lista de ruedas con fecha */}
          <ul className="wheel-hist__list" aria-label="Ruedas registradas">
            {snapshots.map((s, i) => {
              const avg = metricValue(s.areas, AVERAGE);
              const delta = i > 0 ? avg - metricValue(snapshots[i - 1].areas, AVERAGE) : null;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    className={`wheel-hist__item ${s.id === selectedId ? 'is-active' : ''}`}
                    aria-pressed={s.id === selectedId}
                    onClick={() => setSelectedId(s.id)}
                  >
                    <span className="wheel-hist__item-name">{snapshotName(s, i)}</span>
                    <span className="wheel-hist__item-date">{fmtDate(s.created_at)}</span>
                    <span className="wheel-hist__item-avg">
                      {formatWheelValue(avg)}/10
                      {delta != null && delta !== 0 && (
                        <span className={`wheel-hist__delta ${delta > 0 ? 'is-up' : 'is-down'}`}>
                          {delta > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {fmtDelta(delta)}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Rueda seleccionada */}
          {selected && (
            <div className="wheel-hist__selected">
              <p className="wheel-hist__selected-title">
                {snapshotName(selected, selectedIndex)} · <span className="text-muted">{fmtDate(selected.created_at)}</span>
              </p>
              <LifeWheel areas={selected.areas} selected={selectedArea} onSelect={setSelectedArea} />
            </div>
          )}

          {/* Variación de métricas */}
          <div className="wheel-hist__charts">
            <div className="row-between wheel-hist__controls">
              <h3 className="section-title wheel-hist__subtitle">
                <LineChart size={18} aria-hidden="true" /> Variación de métricas
              </h3>
              <label className="wheel-hist__toggle">
                <input type="checkbox" checked={includeLive} onChange={(e) => setIncludeLive(e.target.checked)} />
                Incluir valor actual
              </label>
            </div>

            <label className="wheel-hist__select">
              <span className="sr-only">Métrica</span>
              <select value={metric} onChange={(e) => setMetric(e.target.value)}>
                {METRICS.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>

            {points.length < 2 && (
              <p className="wheel-hist__hint">Rehaz tu rueda para ver cómo cambian tus métricas con el tiempo.</p>
            )}
            <MetricLineChart points={points} label={metricLabel} />
            {includeLive && <p className="wheel-hist__hint">La línea punteada llega a tu rueda actual (con tareas y baja diaria).</p>}

            {/* Una mini gráfica por área; tocarla la muestra arriba */}
            <ul className="wheel-hist__grid-list">
              {WHEEL_AREAS.map((area) => {
                const values = series.map((row) => metricValue(row.areas, area.key));
                const delta = values[values.length - 1] - values[0];
                return (
                  <li key={area.key}>
                    <button
                      type="button"
                      className={`wheel-hist__mini ${metric === area.key ? 'is-active' : ''}`}
                      onClick={() => setMetric(area.key)}
                      aria-label={`${area.label}: de ${formatWheelValue(values[0])} a ${formatWheelValue(values[values.length - 1])}`}
                    >
                      <span className="wheel-hist__mini-head">
                        <span>{area.label}</span>
                        <span className={`wheel-hist__delta ${delta > 0 ? 'is-up' : delta < 0 ? 'is-down' : ''}`}>
                          {fmtDelta(Math.round(delta * 10) / 10)}
                        </span>
                      </span>
                      <Sparkline values={values} />
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Vista en tabla (accesible) */}
            <details className="wheel-hist__table-wrap">
              <summary>Ver tabla de valores</summary>
              <div className="wheel-hist__table-scroll">
                <table className="wheel-hist__table">
                  <thead>
                    <tr>
                      <th scope="col">Área</th>
                      {series.map((row) => (
                        <th key={row.id} scope="col">
                          {row.live ? 'Hoy' : fmtShort(row.date)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {METRICS.map((m) => (
                      <tr key={m.key}>
                        <th scope="row">{m.label}</th>
                        {series.map((row) => (
                          <td key={row.id}>{formatWheelValue(metricValue(row.areas, m.key))}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </div>
        </>
      )}
    </Card>
  );
}
