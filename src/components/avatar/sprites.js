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

/* ---------- Personalización ---------- */

/** Apariencia por defecto (coincide con la paleta original). */
export const DEFAULT_LOOK = {
  skin: '#f1c27d',
  hair: '#3b2a20',
  hairStyle: 'corto',
  outfit: '#2b2f3a',
  accent: '#3d86ff',
};

/** Opciones que se muestran en el personalizador. */
export const LOOK_OPTIONS = {
  skin: [
    { value: '#f9d9b8', label: 'Claro' },
    { value: '#f1c27d', label: 'Trigo' },
    { value: '#d9a066', label: 'Canela' },
    { value: '#a86b3c', label: 'Moreno' },
    { value: '#6b4226', label: 'Café' },
    { value: '#3f2a1d', label: 'Oscuro' },
  ],
  hair: [
    { value: '#1b1b1b', label: 'Negro' },
    { value: '#3b2a20', label: 'Castaño' },
    { value: '#7a4a21', label: 'Avellana' },
    { value: '#d9a441', label: 'Rubio' },
    { value: '#c0392b', label: 'Pelirrojo' },
    { value: '#9b6bff', label: 'Violeta' },
    { value: '#14b8c4', label: 'Turquesa' },
  ],
  hairStyle: [
    { value: 'corto', label: 'Corto' },
    { value: 'largo', label: 'Largo' },
    { value: 'gorra', label: 'Gorra' },
  ],
  outfit: [
    { value: '#2b2f3a', label: 'Grafito' },
    { value: '#7a1f2b', label: 'Guinda' },
    { value: '#1f6f50', label: 'Bosque' },
    { value: '#3b3f8f', label: 'Índigo' },
    { value: '#b45f06', label: 'Ámbar' },
    { value: '#e8e8ec', label: 'Blanco' },
  ],
  accent: [
    { value: '#3d86ff', label: 'Azul' },
    { value: '#ff5a4e', label: 'Coral' },
    { value: '#3ecf6e', label: 'Verde' },
    { value: '#f5a524', label: 'Dorado' },
    { value: '#9b6bff', label: 'Violeta' },
    { value: '#14e0f0', label: 'Cian' },
  ],
};

const HEX = /^#[0-9a-f]{6}$/i;
const STYLES = LOOK_OPTIONS.hairStyle.map((o) => o.value);

/** Completa y valida un look (por si viene incompleto del servidor o de localStorage). */
export function normalizeLook(look) {
  const src = look && typeof look === 'object' ? look : {};
  const pickColor = (key) => (HEX.test(src[key]) ? src[key] : DEFAULT_LOOK[key]);
  return {
    skin: pickColor('skin'),
    hair: pickColor('hair'),
    hairStyle: STYLES.includes(src.hairStyle) ? src.hairStyle : DEFAULT_LOOK.hairStyle,
    outfit: pickColor('outfit'),
    accent: pickColor('accent'),
  };
}

/** Paleta del sprite con los colores elegidos por la persona. */
export function paletteForLook(look) {
  const l = normalizeLook(look);
  return {
    ...PALETTE,
    S: l.skin,
    H: l.hair,
    J: l.outfit,
    L: l.accent,
  };
}

const setChar = (row, idx, ch) => row.slice(0, idx) + ch + row.slice(idx + 1);

/** Aplica el estilo de cabello a las 8 filas de la cabeza. */
function applyHairStyle(head, style) {
  const h = [...head];
  if (style === 'largo') {
    h[4] = setChar(setChar(h[4], 1, 'H'), 10, 'H');
    h[5] = setChar(setChar(h[5], 1, 'H'), 10, 'H');
    h[6] = setChar(setChar(h[6], 2, 'H'), 9, 'H');
    h[7] = setChar(setChar(h[7], 3, 'H'), 8, 'H');
  } else if (style === 'gorra') {
    h[0] = '....LLLL....';
    h[1] = '...LLLLLL...';
    h[2] = '..LLLLLLLL..';
  }
  return h;
}

/** Devuelve el grid de pixels para un mood + nivel (+ estilo de cabello) dados. */
export function spriteFor(level, mood = 'neutral', hairStyle = 'corto') {
  const stage = stageForLevel(level);
  const face = MOOD_FACE[mood] ?? MOOD_FACE.neutral;
  // Reemplaza las filas 4 y 6 del head para reflejar el mood
  const head = [...BASE_HEAD];
  head[4] = face.row4;
  head[6] = face.row6;
  return [...applyHairStyle(head, hairStyle), ...BODY_STAGE[stage]];
}

/** Paleta completa (para uso opcional desde el SVG). */
export const SPRITE_PALETTE = PALETTE;