import { useState } from 'react';
import { Button, Field, Modal } from '../../components/ui';
import { EVENT_TYPES } from '../../context';

const EMPTY = { title: '', date: '', time: '09:00', detail: '', type: 'entrega' };

/** Modal para crear / editar una actividad del calendario. */
export default function EventFormModal({ open, onClose, onSubmit, initial, defaultDate }) {
  // `key` en el padre reinicia el estado cada vez que se abre
  const [form, setForm] = useState(() => ({ ...EMPTY, date: defaultDate, ...initial }));
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
      title={isEdit ? 'Editar actividad' : 'Nueva actividad'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="event-form">
            {isEdit ? 'Guardar' : 'Agregar'}
          </Button>
        </>
      }
    >
      <form id="event-form" className="form-grid" onSubmit={submit}>
        <Field label="Título" placeholder="Ej. Entrega de proyecto" value={form.title} onChange={set('title')} required maxLength={60} />
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
