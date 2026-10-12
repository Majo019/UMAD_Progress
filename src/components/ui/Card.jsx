export function Card({ as: Tag = 'div', className = '', accent, children, ...props }) {
  const classes = ['card', accent && `card--accent card--accent-${accent}`, className].filter(Boolean).join(' ');
  return (
    <Tag className={classes} {...props}>
      {children}
    </Tag>
  );
}

/** color: 'coral' | 'blue' | 'green' | 'amber' | 'neutral' */
export function Chip({ color = 'neutral', icon: Icon, children, className = '' }) {
  return (
    <span className={`chip chip--${color} ${className}`}>
      {Icon && <Icon size={12} strokeWidth={2.4} aria-hidden="true" />}
      {children}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, children }) {
  return (
    <div className="empty-state">
      {Icon && (
        <div className="empty-state__icon">
          <Icon size={22} aria-hidden="true" />
        </div>
      )}
      <p className="empty-state__title">{title}</p>
      {children && <p className="empty-state__text">{children}</p>}
    </div>
  );
}
