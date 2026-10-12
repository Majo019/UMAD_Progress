import { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Field } from '../../../components/ui';

/**
 * Extiende <Field> con:
 * - Mensaje de error debajo (tono empático)
 * - Toggle mostrar/ocultar cuando type="password"
 */
export default function AuthField({
  label,
  type = 'text',
  error,
  hint,
  as = 'input',
  ...props
}) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';
  const finalType = isPassword && visible ? 'text' : type;

  return (
    <div className={`auth-field ${error ? 'auth-field--error' : ''}`}>
      <div className="auth-field__control">
        <Field
          label={label}
          as={as}
          type={as === 'input' ? finalType : undefined}
          hint={!error ? hint : undefined}
          aria-invalid={Boolean(error)}
          {...props}
        />
        {isPassword && as === 'input' && (
          <button
            type="button"
            className="auth-field__toggle"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            tabIndex={-1}
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <p className="auth-field__error" role="alert">
          <AlertCircle size={14} aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}