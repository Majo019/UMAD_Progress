import { useState } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { Button, Modal } from '../ui';
import { useAvatar } from '../../context';
import AvatarSprite from './AvatarSprite';
import { DEFAULT_LOOK, LOOK_OPTIONS } from './sprites';
import './AvatarCustomizer.css';

const GROUPS = [
  { key: 'skin', title: 'Tono de piel', kind: 'color' },
  { key: 'hairStyle', title: 'Peinado', kind: 'text' },
  { key: 'hair', title: 'Color de cabello', kind: 'color' },
  { key: 'outfit', title: 'Ropa', kind: 'color' },
  { key: 'accent', title: 'Color de acento', kind: 'color' },
];

/**
 * Personalizador del avatar (solo disponible con sesión iniciada: vive en Perfil).
 * Muestra una vista previa en vivo y solo guarda al presionar "Guardar".
 */
export default function AvatarCustomizer({ open, onClose }) {
  const { look, setLook, level } = useAvatar();
  const [draft, setDraft] = useState(look);

  const pick = (key, value) => setDraft((d) => ({ ...d, [key]: value }));

  const save = () => {
    setLook(draft);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Personalizar avatar"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button icon={Check} onClick={save}>
            Guardar
          </Button>
        </>
      }
    >
      <div className="avatar-custom">
        <div className="avatar-custom__preview">
          <AvatarSprite size={128} level={level} mood="feliz" look={draft} />
          <Button variant="ghost" size="sm" icon={RotateCcw} onClick={() => setDraft({ ...DEFAULT_LOOK })}>
            Restablecer
          </Button>
        </div>

        {GROUPS.map((group) => (
          <fieldset key={group.key} className="avatar-custom__group">
            <legend className="label-mono">{group.title}</legend>
            <div className="avatar-custom__options">
              {LOOK_OPTIONS[group.key].map((opt) => {
                const selected = draft[group.key] === opt.value;
                return group.kind === 'color' ? (
                  <button
                    key={opt.value}
                    type="button"
                    className={`avatar-custom__swatch ${selected ? 'is-selected' : ''}`}
                    style={{ '--swatch': opt.value }}
                    aria-label={opt.label}
                    aria-pressed={selected}
                    title={opt.label}
                    onClick={() => pick(group.key, opt.value)}
                  >
                    {selected && <Check size={14} strokeWidth={3} aria-hidden="true" />}
                  </button>
                ) : (
                  <button
                    key={opt.value}
                    type="button"
                    className={`avatar-custom__pill ${selected ? 'is-selected' : ''}`}
                    aria-pressed={selected}
                    onClick={() => pick(group.key, opt.value)}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
    </Modal>
  );
}
