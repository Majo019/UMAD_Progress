import { useEffect, useRef, useState } from 'react';
import { Heart, Smile, Utensils, Sparkles } from 'lucide-react';
import { ProgressBar } from '../ui';
import { STAT_META, XP_PER_LEVEL, useAvatar } from '../../context';
import AvatarSprite from './AvatarSprite';
import RewardOverlay from './RewardOverlay';
import './AvatarWidget.css';

const STAT_ICONS = { vida: Heart, alimento: Utensils, carino: Smile };

/** Deriva un mood a partir del promedio de stats. */
function moodFromStats({ vida, alimento, carino }) {
  const avg = (vida + alimento + carino) / 3;
  if (avg >= 80) return 'motivado';
  if (avg >= 60) return 'feliz';
  if (avg >= 40) return 'neutral';
  return 'triste';
}

/**
 * Widget principal del avatar del estudiante.
 * - Lee stats y nivel del AvatarContext (no recibe props de estado).
 * - Anima al cambiar de nivel (overlay celebratorio).
 * - Se usa en ProfileView (size="lg").
 */
export default function AvatarWidget({ size = 96, animated = true }) {
  const { level, xp, stats } = useAvatar();
  const mood = moodFromStats(stats);

  // Detección de subida de nivel → overlay celebratorio
  const [celebrate, setCelebrate] = useState(false);
  const prevLevelRef = useRef(level);

  useEffect(() => {
    if (level > prevLevelRef.current) {
      setCelebrate(true);
      prevLevelRef.current = level;
    }
  }, [level]);

  // aria-label descriptivo
  const ariaLabel = `Avatar nivel ${level}, vida ${stats.vida}%, alimento ${stats.alimento}%, cariño ${stats.carino}%`;

  return (
    <>
      <div
        className={`avatar-widget ${animated ? 'is-animated' : ''}`}
        role="img"
        aria-label={ariaLabel}
      >
        <div className="avatar-widget__sprite">
          <AvatarSprite size={size} level={level} mood={mood} />
          <span className="avatar-widget__level" aria-hidden="true">
            Nvl {level}
          </span>
        </div>

        <div className="avatar-widget__stats">
          {Object.entries(stats).map(([key, value]) => (
            <ProgressBar
              key={key}
              value={value}
              label={STAT_META[key].label}
              color={STAT_META[key].color}
              icon={STAT_ICONS[key]}
            />
          ))}

          <div className="avatar-widget__xp">
            <span className="label-mono">
              <Sparkles size={11} aria-hidden="true" /> XP
            </span>
            <span className="avatar-widget__xp-value">
              {xp}/{XP_PER_LEVEL}
            </span>
          </div>
        </div>
      </div>

      <RewardOverlay
        open={celebrate}
        level={level}
        onClose={() => setCelebrate(false)}
      />
    </>
  );
}