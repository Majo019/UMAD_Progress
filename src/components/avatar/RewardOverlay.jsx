import { useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import './RewardOverlay.css';

/**
 * Overlay celebratorio al subir de nivel.
 * Se autocierra a los 3s. Respeta prefers-reduced-motion (vía CSS).
 */
export default function RewardOverlay({ open, level, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [open, onClose]);

  if (!open) return null;

  // Genera 12 partículas pixeladas en posiciones aleatorias
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: `${10 + Math.random() * 80}%`,
    delay: `${Math.random() * 0.6}s`,
    color: ['var(--color-coral)', 'var(--color-blue)', 'var(--color-green)', 'var(--color-amber)'][i % 4],
  }));

  return (
    <div className="reward-overlay" role="status" aria-live="polite">
      <div className="reward-overlay__content">
        <Sparkles size={40} className="reward-overlay__icon" aria-hidden="true" />
        <h2 className="reward-overlay__title">¡Nivel {level}!</h2>
        <p className="reward-overlay__subtitle">Tu constancia te está transformando.</p>
      </div>

      <div className="reward-overlay__particles" aria-hidden="true">
        {particles.map((p) => (
          <span
            key={p.id}
            className="reward-overlay__particle"
            style={{ left: p.left, animationDelay: p.delay, background: p.color }}
          />
        ))}
      </div>
    </div>
  );
}