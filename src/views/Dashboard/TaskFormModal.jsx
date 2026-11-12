import { useEffect, useState } from 'react';
import { Button, Field, Modal } from '../../components/ui';
import { DIFFICULTY, DIFFICULTY_ORDER, getTaskDifficulty, useAvatar, WHEEL_POINTS_BY_DIFFICULTY } from '../../context';

const EMPTY_FORM = {
  title: '',
  description: '',
  dueDate: '',
  difficulty: 'media',
  area: '',
};

export default function TaskFormModal({
  open,
  initial,
  onClose,
  onSubmit,
}) {
  const { wheel } = useAvatar();

  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;

    if (initial) {
      setForm({
        title: initial.title ?? '',
        description: initial.description ?? '',
        dueDate: initial.dueDate ?? '',
        difficulty: getTaskDifficulty(initial),
        area: initial.area ?? '',
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

    if (!title || !form.area) return;

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
          label="Dificultad"
          as="select"
          name="difficulty"
          value={form.difficulty}
          onChange={handleChange}
        >
          {DIFFICULTY_ORDER.map((key) => (
            <option key={key} value={key}>
              {DIFFICULTY[key].label} (+{WHEEL_POINTS_BY_DIFFICULTY[key]} al área)
            </option>
          ))}
        </Field>

        <Field
          label="Área de la vida"
          as="select"
          name="area"
          value={form.area}
          onChange={handleChange}
          required
        >
          <option value="">Selecciona un área</option>

          {wheel.map((area) => (
            <option key={area.key} value={area.key}>
              {area.label}
            </option>
          ))}
        </Field>
      </form>
    </Modal>
  );
}