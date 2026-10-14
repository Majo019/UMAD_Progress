import { useState } from 'react';
import { Button, Field, Modal } from '../../components/ui';
import { DIFFICULTY, DIFFICULTY_ORDER, EVENT_TYPES, getDifficulty } from '../../context';

const EMPTY = { title: '', date: '', time: '09:00', detail: '', type: 'entrega', difficulty: 'media' };

/** Modal para crear / editar una tarea. */
export default function TaskFormModal({ open, onClose, onSubmit, initial, defaultDate }) {
  // `key` en el padre reinicia el estado cada vez que se abre
  const [form, setForm] = useState(() => {
    const base = { ...EMPTY, date: defaultDate, ...initial };
    return { ...base, difficulty: initial ? getDifficulty(initial) : base.difficulty };
  });
  const isEdit = Boolean(initial?.id);
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSubmit({ ...form, title: form.title.trim(), detail: form.detail.trim() });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar tarea' : 'Nueva tarea'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="task-form">
            {isEdit ? 'Guardar' : 'Agregar'}
          </Button>
        </>
      }
    >
      <form id="task-form" className="form-grid" onSubmit={submit}>
        <Field label="Título" placeholder="Ej. Entrega de proyecto" value={form.title} onChange={set('title')} required maxLength={60} />

        <fieldset className="diff-picker">
          <legend className="field__label">Dificultad</legend>
          <div className="diff-picker__options">
            {DIFFICULTY_ORDER.map((k) => (
              <label key={k} className={`diff-picker__option diff-picker__option--${DIFFICULTY[k].color}`}>
                <input
                  type="radio"
                  name="difficulty"
                  value={k}
                  checked={form.difficulty === k}
                  onChange={set('difficulty')}
                />
                <span className={`task-dot task-dot--${DIFFICULTY[k].color}`} aria-hidden="true" />
                {DIFFICULTY[k].label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="form-grid form-grid--2">
          <Field label="Fecha" type="date" value={form.date} onChange={set('date')} required />
          <Field label="Hora" type="time" value={form.time} onChange={set('time')} />
        </div>
        <Field label="Tipo" as="select" value={form.type} onChange={set('type')}>
          {Object.entries(EVENT_TYPES).map(([key, t]) => (
            <option key={key} value={key}>
              {t.label}
            </option>
          ))}
        </Field>
        <Field label="Materia o lugar" placeholder="Ej. UI/UX Avanzado · Sala Virtual B" value={form.detail} onChange={set('detail')} maxLength={60} />
      </form>
    </Modal>
  );
}
