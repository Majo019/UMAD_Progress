import { useId } from 'react';

/** Campo de formulario con etiqueta. as: 'input' | 'select' | 'textarea' */
export function Field({ label, as = 'input', hint, children, ...props }) {
  const id = useId();
  const Tag = as;
  return (
    <div className="field">
      <label htmlFor={id} className="field__label">
        {label}
      </label>
      {as === 'select' ? (
        <select id={id} className="input" {...props}>
          {children}
        </select>
      ) : (
        <Tag id={id} className="input" {...props} />
      )}
      {hint && <span className="field__hint">{hint}</span>}
    </div>
  );
}
