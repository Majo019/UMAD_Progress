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
  TASK_DIFFICULTIES,
  WHEEL_AREAS,
} from '../../context';
import { useTaskActivity } from '../../hooks/useTaskActivity';

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
  const difficulty =
    TASK_DIFFICULTIES[task.difficulty] ?? TASK_DIFFICULTIES.media;

  return (
    <Card
      as="li"
      accent={difficulty.color}
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

            <Chip color={difficulty.color}>
              {difficulty.label}
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
          onClick={() => onReopen(task)}
        />

        <IconButton
          icon={Trash2}
          label="Eliminar tarea"
          className="icon-btn--sm"
          onClick={() => onDelete(task)}
        />
      </div>
    </Card>
  );
}

export default function TasksHistoryView() {
  // Incluye lo registrado en la pestaña Tareas y las tareas del Dashboard
  const {
    completedTasks,
    reopen,
    remove,
  } = useTaskActivity();

  const getArea = (key) =>
    WHEEL_AREAS.find((area) => area.key === key);

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
              key={task.uid}
              task={task}
              area={getArea(task.area)}
              onReopen={reopen}
              onDelete={remove}
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