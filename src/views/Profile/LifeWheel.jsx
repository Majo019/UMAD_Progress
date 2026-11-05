import { BarChart3 } from 'lucide-react';

/**
 * Rueda de la Vida — gráfica polar (cada área es un "gajo" cuyo largo = valor 0–10).
 * SVG puro, sin librerías.
 */

const SEGMENT_COLORS = [
  'var(--wheel-1)',
  'var(--wheel-2)',
  'var(--wheel-3)',
  'var(--wheel-1)',
  'var(--wheel-2)',
  'var(--wheel-4)',
  'var(--wheel-5)',
  'var(--wheel-3)',
];

const W = 400;
const H = 320;
const CX = W / 2;
const CY = H / 2;
const INNER = 26;
const OUTER = 108;
const LABEL_R = 122;

const rad = (deg) => (deg * Math.PI) / 180;
const pt = (r, deg) => [CX + r * Math.cos(rad(deg)), CY + r * Math.sin(rad(deg))];

function sectorPath(r, a0, a1) {
  const [x0, y0] = pt(r, a0);
  const [x1, y1] = pt(r, a1);
  const [x2, y2] = pt(INNER, a1);
  const [x3, y3] = pt(INNER, a0);
  return `M${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1} L${x2} ${y2} A${INNER} ${INNER} 0 0 0 ${x3} ${y3}Z`;
}

export default function LifeWheel({ areas, selected, onSelect }) {
  const step = 360 / areas.length;
  const active = areas.find((a) => a.key === selected);
  const average = areas.reduce((s, a) => s + a.value, 0) / areas.length;

  return (
    <div className="life-wheel">
      <div className="life-wheel__chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Gráfica de la Rueda de la Vida">
        {/* Anillos guía */}
        {[0.5, 1].map((f) => (
          <circle
            key={f}
            cx={CX}
            cy={CY}
            r={INNER + (OUTER - INNER) * f}
            className="life-wheel__ring"
          />
        ))}
        {areas.map((_, i) => {
          const [x, y] = pt(OUTER, -90 + i * step);
          const [x0, y0] = pt(INNER, -90 + i * step);
          return <line key={i} x1={x0} y1={y0} x2={x} y2={y} className="life-wheel__spoke" />;
        })}

        {/* Gajos */}
        {areas.map((area, i) => {
          const a0 = -90 + i * step + 0.6;
          const a1 = -90 + (i + 1) * step - 0.6;
          const r = INNER + ((OUTER - INNER) * Math.max(area.value, 0.4)) / 10;
          const isActive = area.key === selected;
          return (
            <path
              key={area.key}
              d={sectorPath(r, a0, a1)}
              fill={SEGMENT_COLORS[i % SEGMENT_COLORS.length]}
              className={`life-wheel__sector ${isActive ? 'is-active' : ''} ${selected && !isActive ? 'is-dim' : ''}`}
              tabIndex={0}
              role="button"
              aria-label={`${area.label}: ${area.value} de 10`}
              onClick={() => onSelect?.(isActive ? null : area.key)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect?.(isActive ? null : area.key)}
            />
          );
        })}

        {/* Etiquetas */}
        {areas.map((area, i) => {
          const mid = -90 + (i + 0.5) * step;
          const [x, y] = pt(LABEL_R, mid);
          const cos = Math.cos(rad(mid));
          const anchor = Math.abs(cos) < 0.3 ? 'middle' : cos > 0 ? 'start' : 'end';
          const sin = Math.sin(rad(mid));
          return (
            <text
              key={area.key}
              x={x}
              y={y + (sin > 0.3 ? 8 : sin < -0.3 ? -2 : 4)}
              textAnchor={anchor}
              className={`life-wheel__label ${area.key === selected ? 'is-active' : ''}`}
            >
              {area.label}
            </text>
          );
        })}

        {/* Centro */}
        <circle cx={CX} cy={CY} r={INNER - 2} className="life-wheel__hub" />
      </svg>

      <div className="life-wheel__center" aria-live="polite">
        {active ? (
          <span className="life-wheel__score">{active.value}</span>
        ) : (
          <BarChart3 size={18} aria-hidden="true" />
        )}
      </div>
      </div>

      <p className="life-wheel__caption">
        {active ? (
          <>
            <strong>{active.label}</strong> · {active.value}/10
          </>
        ) : (
          <>
            Balance general <strong>{average.toFixed(1)}</strong>/10 · toca un área para ver su valor
          </>
        )}
      </p>
    </div>
  );
}
