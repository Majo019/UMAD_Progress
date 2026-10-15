import {
  CheckCircle2,
  History,
  RotateCcw,
  Trash2,
} from 'lucide-react';

import {
  Card,
  Chip,
  EmptyState,
  IconButton,
} from '../../components/ui';

import {
  TASK_PRIORITIES,
  useAvatar,
  useTasks,
} from '../../context';

import './tasksHistory.css';

function formatCompletedDate(timestamp) {
  if (!timestamp) return 'Sin fecha registrada';

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

function HistoryItem({
  task,
  area,
  onReopen,
  onDelete,
}) {
  const priority =
    TASK_PRIORITIES[task.priority] ??
    TASK_PRIORITIES.media;

  return (
    <Card
      as="li"
      accent={priority.color}
      className="history-card"
    >
      <div className="history-card__icon">
        <CheckCircle2 size={20} />
      </div>

      <div className="history-card__body">
        <div className="history-card__top">
          <p className="history-card__title">
            {task.title}
          </p>

          <div className="history-card__chips">
            {area && (
              <Chip>
                {area.label}
              </Chip>
            )}

            <Chip color={priority.color}>
              {priority.label}
            </Chip>
          </div>
        </div>

        {task.description && (
          <p className="history-card__description">
            {task.description}
          </p>
        )}

        <p className="history-card__completed">
          Completada: {formatCompletedDate(task.completedAt)}
        </p>

        {task.dueDate && (
          <p className="history-card__due">
            Fecha límite: {task.dueDate}
          </p>
        )}
      </div>

      <div className="history-card__actions">
        <IconButton
          icon={RotateCcw}
          label="Reabrir tarea"
          className="icon-btn--sm"
          onClick={() => onReopen(task.id)}
        />

        <IconButton
          icon={Trash2}
          label="Eliminar tarea"
          className="icon-btn--sm"
          onClick={() => onDelete(task.id)}
        />
      </div>
    </Card>
  );
}

export default function TasksHistoryView() {
  const {
    completedTasks,
    reopenTask,
    removeTask,
  } = useTasks();

  const { wheel } = useAvatar();

  const getArea = (key) =>
    wheel.find((area) => area.key === key);

  return (
    <section className="view tasks-history">
      <div className="tasks-history__header">
        <div>
          <h1 className="page-title">
            Historial de tareas
          </h1>

          <p className="tasks-history__subtitle">
            {completedTasks.length}{' '}
            tarea
            {completedTasks.length !== 1 ? 's' : ''}{' '}
            completada
            {completedTasks.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {completedTasks.length ? (
        <ul className="history-list">
          {completedTasks.map((task) => (
            <HistoryItem
              key={task.id}
              task={task}
              area={getArea(task.area)}
              onReopen={reopenTask}
              onDelete={removeTask}
            />
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={History}
          title="Sin tareas completadas"
        >
          Cuando completes una tarea aparecerá aquí.
        </EmptyState>
      )}
    </section>
  );
}