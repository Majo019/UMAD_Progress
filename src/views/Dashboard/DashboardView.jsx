import { useState } from 'react';
import { Check, Circle, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button, Card, Chip, EmptyState, IconButton } from '../../components/ui';
import { TASK_PRIORITIES, useTasks } from '../../context';
import TaskFormModal from './TaskFormModal';
import './dashboard.css';

function TaskItem({ task, onComplete, onEdit, onDelete }) {
  const priority = TASK_PRIORITIES[task.priority] ?? TASK_PRIORITIES.media;

  return (
    <Card as="li" accent={priority.color} className="task-card">
      <button
        type="button"
        className="task-check"
        onClick={() => onComplete(task.id)}
        aria-label={`Completar ${task.title}`}
      >
        {task.completed ? <Check size={18} /> : <Circle size={18} />}
      </button>

      <div className="task-card__body">
        <div className="task-card__top">
          <p className="task-card__title">{task.title}</p>
          <Chip color={priority.color}>{priority.label}</Chip>
        </div>

        {task.description && (
          <p className="task-card__description">{task.description}</p>
        )}

        {task.dueDate && (
          <p className="task-card__date">
            Fecha límite: {task.dueDate}
          </p>
        )}
      </div>

      <IconButton
  icon={Pencil}
  label="Editar tarea"
  className="icon-btn--sm"
  onClick={() => onEdit(task)}
/>

      <IconButton
        icon={Trash2}
        label="Eliminar tarea"
        className="icon-btn--sm"
        onClick={() => onDelete(task.id)}
      />
    </Card>
  );
}

export default function DashboardView() {
const {
  pendingTasks,
  addTask,
  updateTask,
  completeTask,
  removeTask,
} = useTasks();

const [modal, setModal] = useState(null);

  return (
    <section className="view dashboard">
      <div className="dashboard__header">
        <div>
          <h1 className="page-title">Pendientes</h1>
          <p className="dashboard__subtitle">
            {pendingTasks.length} tarea{pendingTasks.length !== 1 ? 's' : ''} pendiente
            {pendingTasks.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {pendingTasks.length ? (
        <ul className="task-list">
          {pendingTasks.map((task) => (
<TaskItem
  key={task.id}
  task={task}
  onComplete={completeTask}
  onEdit={(task) => setModal({ initial: task })}
  onDelete={removeTask}
/>
          ))}
        </ul>
      ) : (
        <EmptyState icon={Check} title="Todo listo">
          No tienes tareas pendientes por ahora.
        </EmptyState>
      )}

<Button
  variant="dashed"
  icon={Plus}
  onClick={() => setModal({})}
>
  Nueva tarea
</Button>

{modal && (
  <TaskFormModal
    open
    initial={modal.initial}
    onClose={() => setModal(null)}
    onSubmit={(data) => {
      if (modal.initial) {
        updateTask(modal.initial.id, data);
      } else {
        addTask(data);
      }
    }}
  />
)}
    </section>
  );
}