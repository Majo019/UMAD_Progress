/**
 * Sprites pixel-art del avatar.
 * Cada sprite es un array de strings donde cada carácter = un color.
 * '.' = transparente.
 *
 * 4 moods × 3 variaciones (por nivel): feliz, neutral, triste, motivado.
 * La variación se elige por rango de nivel:
 *   - Nivel 1–9:  'novato'   (hoodie simple)
 *   - Nivel 10–24: 'medio'   (con chaqueta azul)
 *   - Nivel 25+:   'experto' (con capa y accesorio)
 *
 * ⚠️ Sustituir por pixel-art final cuando esté listo.
 * Formato: cada fila debe tener el mismo largo.
 */

const PALETTE = {
  H: '#3b2a20', // pelo
  S: '#f1c27d', // piel
  E: '#1b1b1b', // ojos
  M: '#c2655a', // boca
  J: '#2b2f3a', // ropa oscura
  L: '#3d86ff', // detalle azul
  P: '#2f4a7a', // pantalón
  B: '#151515', // botas
  W: '#ffffff', // brillo / destello
  Y: '#f5a524', // accesorio dorado (nivel alto)
  R: '#ff5a4e', // capa coral (nivel alto)
  T: '#14e0f0', // acento cian
};

/** Base común — cabeza, ojos, boca neutra. */
const BASE_HEAD = [
  '....HHHH....',
  '...HHHHHH...',
  '..HHHHHHHH..',
  '..HSSSSSSH..',
  '..SSESSESS..',
  '..SSSSSSSS..',
  '...SSMMSS...',
  '....SSSS....',
];

/** Mood → variaciones faciales (filas 5 y 6, índice 4 y 6). */
const MOOD_FACE = {
  feliz:    { row4: '..SSESSESS..', row6: '...SSMMSS...' },
  neutral:  { row4: '..SSESSESS..', row6: '...SSSSSS...' },
  triste:   { row4: '..SSESSESS..', row6: '...SMMMSS...' },
  motivado: { row4: '..SSESSESS..', row6: '...SSMMSS...' },
};

/** Cuerpo por etapa de nivel. */
const BODY_STAGE = {
  novato: [
    '..JJJJJJJJ..',
    '.JJJJLLJJJJ.',
    '.SJJJLLJJJS.',
    '.SJJJJJJJJS.',
    '..PPPPPPPP..',
    '..PPP..PPP..',
    '..PPP..PPP..',
    '..BBB..BBB..',
  ],
  medio: [
    '..JJJJJJJJ..',
    '.JJJLLLJJJJ.',
    'SJJJJLJJJJS.',
    'SJJJJJJJJJS.',
    '..PPPPPPPP..',
    '..PPP..PPP..',
    '..PPP..PPP..',
    '..BBB..BBB..',
  ],
  experto: [
    '..RRJJJJRR..',
    '.RRJLLLJJRR.',
    'SRJJJLJJJRS.',
    'SRJJJJJJJRS.',
    '..PPPPPPPP..',
    '..PPP..PPP..',
    '..PPP..PPP..',
    '..YYB..BYY..',
  ],
};

/** Elige la etapa según el nivel. */
export function stageForLevel(level) {
  if (level >= 25) return 'experto';
  if (level >= 10) return 'medio';
  return 'novato';
}

/** Devuelve el grid de pixels para un mood + nivel dados. */
export function spriteFor(level, mood = 'neutral') {
  const stage = stageForLevel(level);
  const face = MOOD_FACE[mood] ?? MOOD_FACE.neutral;
  // Reemplaza las filas 4 y 6 del head para reflejar el mood
  const head = [...BASE_HEAD];
  head[4] = face.row4;
  head[6] = face.row6;
  return [...head, ...BODY_STAGE[stage]];
}

/** Paleta completa (para uso opcional desde el SVG). */
export const SPRITE_PALETTE = PALETTE;