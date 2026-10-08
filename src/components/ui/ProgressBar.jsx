/** Barra de progreso con ícono, etiqueta y porcentaje (estado del avatar). */
export function ProgressBar({ value, max = 100, color = 'coral', icon: Icon, label, showLabel = true }) {
  const pct = Math.round((Math.min(max, Math.max(0, value)) / max) * 100);
  return (
    <div className={`progress progress--${color}`}>
      {(Icon || (showLabel && label)) && (
        <div className="progress__head">
          {Icon && <Icon size={14} strokeWidth={2.4} aria-hidden="true" className="progress__icon" />}
          {showLabel && label && <span className="progress__label">{label}</span>}
          <span className="progress__value">{pct}%</span>
        </div>
      )}
      <div
        className="progress__track"
        role="progressbar"
        aria-label={label}
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="progress__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
