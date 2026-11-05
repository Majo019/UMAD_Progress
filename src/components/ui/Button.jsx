/**
 * Botón base del design system.
 * variant: 'primary' | 'secondary' | 'ghost' | 'dashed' | 'success' | 'blue'
 * size: 'sm' | 'md'
 */
export function Button({ variant = 'primary', size = 'md', block = false, icon: Icon, className = '', children, ...props }) {
  const classes = ['btn', `btn--${variant}`, `btn--${size}`, block && 'btn--block', className]
    .filter(Boolean)
    .join(' ');
  return (
    <button type="button" className={classes} {...props}>
      {Icon && <Icon size={size === 'sm' ? 16 : 18} strokeWidth={2.2} aria-hidden="true" />}
      {children}
    </button>
  );
}

export function IconButton({ icon: Icon, label, size = 20, className = '', ...props }) {
  return (
    <button type="button" className={`icon-btn ${className}`} aria-label={label} title={label} {...props}>
      <Icon size={size} strokeWidth={2} aria-hidden="true" />
    </button>
  );
}
