/**
 * AvatarSlot — avatar pixel-art provisional.
 * ⚠️ El Widget Avatar Interactivo (4.5) lo hace Zahid.
 * Cuando esté listo, se reemplaza este componente por el suyo en ProfileView.
 */

const PIXELS = [
  '....HHHH....',
  '...HHHHHH...',
  '..HHHHHHHH..',
  '..HSSSSSSH..',
  '..SSESSESS..',
  '..SSSSSSSS..',
  '...SSMMSS...',
  '....SSSS....',
  '..JJJJJJJJ..',
  '.JJJJLLJJJJ.',
  '.SJJJLLJJJS.',
  '.SJJJJJJJJS.',
  '..PPPPPPPP..',
  '..PPP..PPP..',
  '..PPP..PPP..',
  '..BBB..BBB..',
];

const COLORS = {
  H: '#3b2a20',
  S: '#f1c27d',
  E: '#1b1b1b',
  M: '#c2655a',
  J: '#2b2f3a',
  L: '#3d86ff',
  P: '#2f4a7a',
  B: '#151515',
};

export default function AvatarSlot({ size = 96, level }) {
  const w = PIXELS[0].length;
  const h = PIXELS.length;
  return (
    <div className="avatar-slot">
      <svg
        width={size}
        height={(size * h) / w}
        viewBox={`0 0 ${w} ${h}`}
        shapeRendering="crispEdges"
        role="img"
        aria-label="Avatar del estudiante"
      >
        {PIXELS.flatMap((row, y) =>
          [...row].map((c, x) => (c === '.' ? null : <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={COLORS[c]} />)),
        )}
      </svg>
      {level != null && <span className="avatar-slot__level">Nvl {level}</span>}
    </div>
  );
}
