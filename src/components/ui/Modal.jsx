import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Modal tipo "bottom sheet" en móvil y centrado en escritorio.
 * dismissible={false} lo vuelve obligatorio: sin botón X, sin Escape y sin cerrar al hacer clic fuera.
 */
export function Modal({ open, onClose, title, children, footer, dismissible = true }) {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && dismissible) onCloseRef.current?.();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.querySelector('input, select, textarea, button')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, dismissible]);

  if (!open) return null;

  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => dismissible && e.target === e.currentTarget && onClose?.()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} ref={panelRef}>
        <div className="modal__header">
          <h2 className="modal__title">{title}</h2>
          {dismissible && (
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar">
              <X size={20} />
            </button>
          )}
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
