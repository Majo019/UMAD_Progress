import { useEffect, useState } from 'react';
import { Button, Field, Modal } from '../../components/ui';

const EMPTY_FORM = {
  title: '',
  description: '',
  dueDate: '',
  priority: 'media',
};

export default function TaskFormModal({
  open,
  initial,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;

    if (initial) {
      setForm({
        title: initial.title ?? '',
        description: initial.description ?? '',
        dueDate: initial.dueDate ?? '',
        priority: initial.priority ?? 'media',
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, initial]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const title = form.title.trim();

    if (!title) return;

    onSubmit({
      ...form,
      title,
      description: form.description.trim(),
    });

    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Editar tarea' : 'Nueva tarea'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>

          <Button onClick={handleSubmit}>
            {initial ? 'Guardar cambios' : 'Crear tarea'}
          </Button>
        </>
      }
    >
      <form className="form-grid" onSubmit={handleSubmit}>
        <Field
          label="Nombre de la tarea"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Ej. Terminar reporte"
          required
        />

        <Field
          label="Descripción"
          as="textarea"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Agrega detalles de la tarea"
        />

        <Field
          label="Fecha límite"
          type="date"
          name="dueDate"
          value={form.dueDate}
          onChange={handleChange}
        />

        <Field
          label="Prioridad"
          as="select"
          name="priority"
          value={form.priority}
          onChange={handleChange}
        >
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </Field>
      </form>
    </Modal>
  );
}