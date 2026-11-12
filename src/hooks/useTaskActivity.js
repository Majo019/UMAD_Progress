import { useCallback, useMemo } from 'react';
import { getDifficulty, useCalendar } from '../context/CalendarContext';
import { getTaskDifficulty, useTasks } from '../context/TasksContext';

/**
 * Une en una sola lista las dos fuentes de tareas de la app:
 * - `calendar`: las que se registran en la pestaña Tareas (CalendarContext).
 * - `server`: las del Dashboard, guardadas en /api/tasks/ (TasksContext).
 *
 * La usan el historial del perfil (Tareas Pasadas) y la retroalimentación
 * de la Rueda de la Vida final, para que ambos lean exactamente lo mismo.
 *
 * Tarea normalizada: { uid, id, source, title, description, area, difficulty,
 *                      completed, completedAt, dueDate }
 */

const fromCalendar = (event) => ({
  uid: `calendar:${event.id}`,
  id: event.id,
  source: 'calendar',
  title: event.title,
  description: event.detail || '',
  area: event.area || null,
  difficulty: getDifficulty(event),
  completed: Boolean(event.completed),
  completedAt: event.completedAt || null,
  dueDate: [event.date, event.time].filter(Boolean).join(' '),
});

const fromServer = (task) => ({
  uid: `server:${task.id}`,
  id: task.id,
  source: 'server',
  title: task.title,
  description: task.description || '',
  area: task.area || null,
  difficulty: getTaskDifficulty(task),
  completed: Boolean(task.completed),
  completedAt: task.completedAt || task.completed_at || null,
  dueDate: task.dueDate || task.due_date || '',
});

const completedTime = (task) => new Date(task.completedAt || 0).getTime() || 0;

export function useTaskActivity() {
  const { events, reopenEvent, removeEvent } = useCalendar();
  const { tasks, reopenTask, removeTask } = useTasks();

  const allTasks = useMemo(
    () => [...events.map(fromCalendar), ...tasks.map(fromServer)],
    [events, tasks],
  );

  const completedTasks = useMemo(
    () => allTasks.filter((t) => t.completed).sort((a, b) => completedTime(b) - completedTime(a)),
    [allTasks],
  );

  const reopen = useCallback(
    (task) => (task.source === 'calendar' ? reopenEvent(task.id) : reopenTask(task.id)),
    [reopenEvent, reopenTask],
  );

  const remove = useCallback(
    (task) => (task.source === 'calendar' ? removeEvent(task.id) : removeTask(task.id)),
    [removeEvent, removeTask],
  );

  return { allTasks, completedTasks, reopen, remove };
}
