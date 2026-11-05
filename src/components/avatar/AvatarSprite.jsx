import { useMemo } from 'react';
import { SPRITE_PALETTE, spriteFor } from './sprites';

/**
 * Sprite pixel-art puro (SVG). No incluye badge de nivel ni barras.
 * Props:
 *   - size: ancho en px
 *   - level: número (elige etapa)
 *   - mood: 'feliz' | 'neutral' | 'triste' | 'motivado'
 *   - className: opcional
 */
export default function AvatarSprite({ size = 96, level = 1, mood = 'neutral', className = '' }) {
  const grid = useMemo(() => spriteFor(level, mood), [level, mood]);
  const w = grid[0].length;
  const h = grid.length;

  return (
    <svg
      width={size}
      height={(size * h) / w}
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      className={`avatar-sprite ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      {grid.flatMap((row, y) =>
        [...row].map((c, x) =>
          c === '.' ? null : (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width="1"
              height="1"
              fill={SPRITE_PALETTE[c] || '#000'}
            />
          ),
        ),
      )}
    </svg>
  );
}