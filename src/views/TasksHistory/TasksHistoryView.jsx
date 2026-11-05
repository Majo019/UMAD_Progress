import {
  ArrowDownRight,
  ArrowUpRight,
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

function getWeekStart(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const daysSinceMonday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - daysSinceMonday);
  return start;
}

function countTasksInRange(tasks, start, end) {
  return tasks.filter((task) => {
    const timestamp = Number(task.completedAt);
    return Number.isFinite(timestamp) && timestamp >= start.getTime() && timestamp < end.getTime();
  }).length;
}

function formatWeekRange(start) {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const format = (date) => new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short' }).format(date);
  return `${format(start)} – ${format(end)}`;
}

function WeeklyComparison({ tasks }) {
  const currentStart = getWeekStart(new Date());
  const previousStart = new Date(currentStart);
  previousStart.setDate(previousStart.getDate() - 7);
  const nextWeek = new Date(currentStart);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const currentCount = countTasksInRange(tasks, currentStart, nextWeek);
  const previousCount = countTasksInRange(tasks, previousStart, currentStart);
  const maxCount = Math.max(currentCount, previousCount, 1);
  const difference = currentCount - previousCount;
  const ChangeIcon = difference > 0 ? ArrowUpRight : ArrowDownRight;
  const changeLabel = difference === 0
    ? 'Sin cambio respecto a la semana anterior'
    : `${difference > 0 ? '+' : ''}${difference} ${Math.abs(difference) === 1 ? 'tarea' : 'tareas'} vs. semana anterior`;

  return (
    <Card className="history-comparison">
      <div className="history-comparison__heading">
        <div>
          <h2 className="section-title">Comparación semanal</h2>
          <p className="history-comparison__subtitle">Tareas completadas</p>
        </div>
        <p className={`history-comparison__change ${difference > 0 ? 'is-positive' : difference < 0 ? 'is-negative' : ''}`}>
          {difference !== 0 && <ChangeIcon size={16} aria-hidden="true" />}
          {changeLabel}
        </p>
      </div>

      <div className="history-comparison__rows">
        {[
          { label: 'Esta semana', range: formatWeekRange(currentStart), count: currentCount, color: 'blue' },
          { label: 'Semana anterior', range: formatWeekRange(previousStart), count: previousCount, color: 'coral' },
        ].map((week) => (
          <div className="history-comparison__row" key={week.label}>
            <div className="history-comparison__label">
              <span>{week.label}</span>
              <span className="history-comparison__range">{week.range}</span>
            </div>
            <div className="history-comparison__bar-line">
              <div className={`history-comparison__bar history-comparison__bar--${week.color}`}>
                <span style={{ width: `${(week.count / maxCount) * 100}%` }} />
              </div>
              <strong>{week.count}</strong>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
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

      <WeeklyComparison tasks={completedTasks} />

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