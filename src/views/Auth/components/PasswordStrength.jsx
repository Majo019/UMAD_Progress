import { evaluatePassword } from '../validators';

/** Barra de fortaleza con 4 segmentos + hint de lo que falta. */
export default function PasswordStrength({ value = '' }) {
  if (!value) return null;
  const { score, label, hints } = evaluatePassword(value);
  const levels = ['none', 'weak', 'ok', 'good', 'strong'];
  const level = levels[score] ?? 'none';

  return (
    <div className={`pwd-strength pwd-strength--${level}`} aria-live="polite">
      <div className="pwd-strength__bars" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`pwd-strength__bar ${i < score ? 'is-on' : ''}`} />
        ))}
      </div>
      <div className="pwd-strength__meta">
        <span className="label-mono">{label}</span>
        {hints.length > 0 && <span className="text-muted">· {hints.join(' · ')}</span>}
      </div>
    </div>
  );
}