import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  Circle,
  Clock3,
  History,
  ListChecks,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';

import {
  Button,
  Card,
  Chip,
  EmptyState,
  IconButton,
} from '../../components/ui';

import {
  TASK_DIFFICULTIES,
  getTaskDifficulty,
  useAvatar,
  useTasks,
} from '../../context';

import TaskFormModal from './TaskFormModal';
import { expandRecurrence } from '../../utils/recurrence';
import './dashboard.css';

function TaskItem({
  task,
  onComplete,
  onEdit,
  onDelete,
}) {
  const difficulty =
    TASK_DIFFICULTIES[getTaskDifficulty(task)];

  const { wheel } = useAvatar();

  const area = wheel.find(
    (item) => item.key === task.area,
  );

  return (
    <Card
      as="li"
      accent={difficulty.color}
      className="task-card"
    >
      <button
        type="button"
        className="task-check"
        onClick={() => onComplete(task.id)}
        aria-label={`Completar ${task.title}`}
      >
        {task.completed ? (
          <Check size={18} />
        ) : (
          <Circle size={18} />
        )}
      </button>

      <div className="task-card__body">
        <div className="task-card__top">
          <p className="task-card__title">
            {task.title}
          </p>

          <div className="task-card__chips">
            {area && (
              <Chip>
                {area.label}
              </Chip>
            )}

            <Chip color={difficulty.color}>
              {difficulty.label}
            </Chip>
          </div>
        </div>

        {task.description && (
          <p className="task-card__description">
            {task.description}
          </p>
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
    completedTasks,
    addTask,
    updateTask,
    completeTask,
    removeTask,
  } = useTasks();

  const { wheel } = useAvatar();

  const navigate = useNavigate();

  const [modal, setModal] = useState(null);

  const nextTask = useMemo(() => {
    return pendingTasks.find(
      (task) => task.dueDate,
    );
  }, [pendingTasks]);

  const nextTaskDifficulty = nextTask
    ? TASK_DIFFICULTIES[getTaskDifficulty(nextTask)]
    : null;

  const nextTaskArea = nextTask
    ? wheel.find(
        (area) => area.key === nextTask.area,
      )
    : null;

  const handleSubmit = ({ recurrence, ...data }) => {
    if (modal?.initial) {
      updateTask(
        modal.initial.id,
        data,
      );
    } else {
      // Tarea recurrente: se crea una tarea por cada fecha de la serie
      expandRecurrence(data.dueDate, recurrence).forEach((dueDate) => addTask({ ...data, dueDate }));
      if (!data.dueDate) addTask(data);
    }
  };

  return (
    <section className="view dashboard">
      <div className="dashboard__header">
        <div>
          <h1 className="page-title">
            Inicio
          </h1>

          <p className="dashboard__subtitle">
            Organiza tus pendientes y revisa tu progreso.
          </p>
        </div>
      </div>

      <div className="dashboard__stats">
        <Card className="dashboard-stat">
          <div className="dashboard-stat__icon">
            <ListChecks size={20} />
          </div>

          <div>
            <span className="dashboard-stat__label">
              Pendientes
            </span>

            <strong className="dashboard-stat__value">
              {pendingTasks.length}
            </strong>
          </div>
        </Card>

        <Card className="dashboard-stat dashboard-stat--history">
          <div className="dashboard-stat__icon dashboard-stat__icon--green">
            <Check size={20} />
          </div>

          <div className="dashboard-stat__content">
            <div>
              <span className="dashboard-stat__label">
                Completadas
              </span>

              <strong className="dashboard-stat__value">
                {completedTasks.length}
              </strong>
            </div>

            <IconButton
              icon={History}
              label="Ver historial"
              className="icon-btn--sm"
              onClick={() =>
                navigate('/tareas-pasadas')
              }
            />
          </div>
        </Card>
      </div>

      <Card className="dashboard__next">
        <div className="dashboard__next-header">
          <div>
            <span className="label-mono">
              Próxima tarea
            </span>

            <p className="dashboard__next-subtitle">
              La siguiente entrega con fecha límite.
            </p>
          </div>

          <Clock3 size={20} />
        </div>

        {nextTask ? (
          <div className="dashboard__next-task">
            <div className="dashboard__next-info">
              <strong>
                {nextTask.title}
              </strong>

              <div className="dashboard__next-chips">
                {nextTaskArea && (
                  <Chip>
                    {nextTaskArea.label}
                  </Chip>
                )}

                <Chip color={nextTaskDifficulty.color}>
                  {nextTaskDifficulty.label}
                </Chip>
              </div>
            </div>

            <span className="dashboard__next-date">
              {nextTask.dueDate}
            </span>
          </div>
        ) : (
          <p className="text-muted">
            No tienes tareas con fecha límite.
          </p>
        )}
      </Card>

      <div className="dashboard__section-header">
        <div>
          <h2 className="dashboard__section-title">
            Pendientes
          </h2>

          <p className="dashboard__subtitle">
            {pendingTasks.length}{' '}
            tarea
            {pendingTasks.length !== 1 ? 's' : ''}{' '}
            pendiente
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
              onEdit={(selectedTask) =>
                setModal({
                  initial: selectedTask,
                })
              }
              onDelete={removeTask}
            />
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={Check}
          title="Todo listo"
        >
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
          onSubmit={handleSubmit}
        />
      )}
    </section>
  );
}