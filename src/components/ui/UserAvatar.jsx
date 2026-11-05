const PALETTE = [
  ['#3d86ff', '#14e0f0'],
  ['#ff5a4e', '#ffb4a8'],
  ['#3ecf6e', '#9be7b4'],
  ['#f5a524', '#ffd58a'],
  ['#9b6bff', '#c9b2ff'],
];

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

/** Foto circular con iniciales (para usuarios / amigos). */
export function UserAvatar({ name = '', size = 48 }) {
  const initials = name
    .replace(/\./g, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
  const [a, b] = PALETTE[hash(name) % PALETTE.length];
  return (
    <span
      className="user-avatar"
      style={{ width: size, height: size, fontSize: size * 0.36, '--ua-a': a, '--ua-b': b }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
