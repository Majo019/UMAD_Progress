import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePersistentState } from '../hooks/usePersistentState';
import { useAvatar } from './AvatarContext';
import { useAuth } from './AuthContext';
import { DIFFICULTY } from './CalendarContext';
import { api, getAuthToken } from '../utils/api';

/** Las tareas usan la misma dificultad que el calendario: tranquila / media / difícil. */
export const TASK_DIFFICULTIES = DIFFICULTY;

// Tareas guardadas antes del cambio de prioridad (alta/media/baja) a dificultad
const LEGACY_PRIORITY_TO_DIFFICULTY = { alta: 'dificil', media: 'media', baja: 'tranquila' };

export function getTaskDifficulty(task) {
  if (DIFFICULTY[task?.difficulty]) return task.difficulty;
  return LEGACY_PRIORITY_TO_DIFFICULTY[task?.priority] ?? 'media';
}

const TASK_REWARD = {
  vida: 5,
  alimento: 5,
  xp: 10,
};

/**
 * Las tareas de ejemplo (t1, t2, t3) ya no se generan. Esta lista sirve para
 * limpiar a quienes las tenían guardadas en el navegador de versiones anteriores.
 */
const LEGACY_SEED_TASKS = {
  t1: 'Terminar avance del proyecto',
  t2: 'Repasar Base de Datos',
  t3: 'Revisar calendario',
};

const isLegacySeedTask = (task) => LEGACY_SEED_TASKS[task?.id] === task?.title;

const TasksContext = createContext(null);

export function TasksProvider({ children }) {
  const [tasks, setTasks] = usePersistentState('up:tasks', []);
  const [loading, setLoading] = useState(false);
  const { user, refreshUser } = useAuth();
  const { applyReward } = useAvatar();

  // Borra las tareas de ejemplo que hayan quedado guardadas en este navegador
  useEffect(() => {
    if (tasks.some(isLegacySeedTask)) {
      setTasks((prev) => prev.filter((task) => !isLegacySeedTask(task)));
    }
  }, [tasks, setTasks]);

  // Sincronizar tareas con el backend Django (/api/tasks/)
  const refreshTasks = useCallback(async () => {
    if (!getAuthToken()) return;

    try {
      setLoading(true);
      const serverTasks = await api.get('/api/tasks/');
      if (Array.isArray(serverTasks)) {
        setTasks(serverTasks);
      }
    } catch (err) {
      console.warn('No se pudieron obtener las tareas del backend:', err);
    } finally {
      setLoading(false);
    }
  }, [setTasks]);

  useEffect(() => {
    if (user && getAuthToken()) {
      refreshTasks();
    }
  }, [user, refreshTasks]);

  const addTask = useCallback(
    async (taskData) => {
      const tempId = `t-${Date.now()}`;
      const newTask = {
        ...taskData,
        id: tempId,
        completed: false,
        completedAt: null,
        createdAt: new Date().toISOString(),
      };

      // Optimistic update
      setTasks((prev) => [...prev, newTask]);

      if (getAuthToken()) {
        try {
          const created = await api.post('/api/tasks/', {
            title: taskData.title,
            description: taskData.description || '',
            dueDate: taskData.dueDate || '',
            difficulty: getTaskDifficulty(taskData),
            area: taskData.area || 'trabajo',
            completed: false,
          });

          if (created && created.id) {
            setTasks((prev) =>
              prev.map((item) => (String(item.id) === String(tempId) ? created : item)),
            );
          }
        } catch (err) {
          console.error('Error al guardar tarea en el backend:', err);
        }
      }
    },
    [setTasks],
  );

  const updateTask = useCallback(
    async (id, patch) => {
      setTasks((prev) =>
        prev.map((task) =>
          String(task.id) === String(id)
            ? {
                ...task,
                ...patch,
              }
            : task,
        ),
      );

      if (getAuthToken()) {
        try {
          const isNumeric = !String(id).startsWith('t');
          if (isNumeric) {
            await api.patch(`/api/tasks/${id}/`, patch);
          }
        } catch (err) {
          console.error('Error al actualizar tarea en el backend:', err);
        }
      }
    },
    [setTasks],
  );

  const removeTask = useCallback(
    async (id) => {
      setTasks((prev) => prev.filter((task) => String(task.id) !== String(id)));

      if (getAuthToken()) {
        try {
          const isNumeric = !String(id).startsWith('t');
          if (isNumeric) {
            await api.delete(`/api/tasks/${id}/`);
          }
        } catch (err) {
          console.error('Error al eliminar tarea en el backend:', err);
        }
      }
    },
    [setTasks],
  );

  const completeTask = useCallback(
    async (id) => {
      const task = tasks.find((item) => String(item.id) === String(id));

      if (!task || task.completed) return;

      const completedAt = new Date().toISOString();

      setTasks((prev) =>
        prev.map((item) =>
          String(item.id) === String(id)
            ? {
                ...item,
                completed: true,
                completedAt,
              }
            : item,
        ),
      );

      applyReward(TASK_REWARD);

      // El servidor suma los puntos a la rueda según la dificultad (una sola vez por tarea)
      if (getAuthToken()) {
        try {
          const isNumeric = !String(id).startsWith('t');
          if (isNumeric) {
            const updated = await api.post(`/api/tasks/${id}/complete/`);
            if (updated?.id) {
              setTasks((prev) => prev.map((item) => (String(item.id) === String(id) ? updated : item)));
            }
            refreshUser?.();
          }
        } catch (err) {
          console.error('Error al marcar tarea completada en backend:', err);
        }
      }
    },
    [tasks, setTasks, applyReward, refreshUser],
  );

  const reopenTask = useCallback(
    async (id) => {
      setTasks((prev) =>
        prev.map((task) =>
          String(task.id) === String(id)
            ? {
                ...task,
                completed: false,
                completedAt: null,
              }
            : task,
        ),
      );

      if (getAuthToken()) {
        try {
          const isNumeric = !String(id).startsWith('t');
          if (isNumeric) {
            await api.post(`/api/tasks/${id}/reopen/`);
          }
        } catch (err) {
          console.error('Error al reabrir tarea en backend:', err);
        }
      }
    },
    [setTasks],
  );

  const pendingTasks = useMemo(
    () =>
      tasks
        .filter((task) => !task.completed)
        .sort((a, b) => {
          if (!a.dueDate && !b.dueDate) {
            const timeA = new Date(a.createdAt || 0).getTime() || 0;
            const timeB = new Date(b.createdAt || 0).getTime() || 0;
            return timeB - timeA;
          }

          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;

          return a.dueDate.localeCompare(b.dueDate);
        }),
    [tasks],
  );

  const completedTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.completed)
        .sort((a, b) => {
          const timeA = new Date(a.completedAt || 0).getTime() || 0;
          const timeB = new Date(b.completedAt || 0).getTime() || 0;
          return timeB - timeA;
        }),
    [tasks],
  );

  const value = useMemo(
    () => ({
      tasks,
      pendingTasks,
      completedTasks,
      loading,

      addTask,
      updateTask,
      removeTask,
      completeTask,
      reopenTask,
      refreshTasks,

      resetTasks: () => setTasks([]),
    }),
    [
      tasks,
      pendingTasks,
      completedTasks,
      loading,
      addTask,
      updateTask,
      removeTask,
      completeTask,
      reopenTask,
      refreshTasks,
      setTasks,
    ],
  );

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasks() {
  const ctx = useContext(TasksContext);

  if (!ctx) {
    throw new Error('useTasks debe usarse dentro de <TasksProvider>');
  }

  return ctx;
}
