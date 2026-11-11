import { useMemo } from 'react';
import { normalizeLook, paletteForLook, spriteFor } from './sprites';

/**
 * Sprite pixel-art puro (SVG). No incluye badge de nivel ni barras.
 * Props:
 *   - size: ancho en px
 *   - level: número (elige etapa)
 *   - mood: 'feliz' | 'neutral' | 'triste' | 'motivado'
 *   - look: { skin, hair, hairStyle, outfit, accent } (opcional, personalización)
 *   - className: opcional
 */
export default function AvatarSprite({ size = 96, level = 1, mood = 'neutral', look, className = '' }) {
  const safeLook = useMemo(() => normalizeLook(look), [look]);
  const palette = useMemo(() => paletteForLook(safeLook), [safeLook]);
  const grid = useMemo(() => spriteFor(level, mood, safeLook.hairStyle), [level, mood, safeLook.hairStyle]);
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
              fill={palette[c] || '#000'}
            />
          ),
        ),
      )}
    </svg>
  );
}