import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePersistentState } from '../hooks/usePersistentState';
import { useAvatar } from './AvatarContext';
import { useAuth } from './AuthContext';
import { api, getAuthToken } from '../utils/api';

export const TASK_PRIORITIES = {
  alta: { label: 'Alta', color: 'coral' },
  media: { label: 'Media', color: 'amber' },
  baja: { label: 'Baja', color: 'green' },
};

const TASK_REWARD = {
  vida: 5,
  alimento: 5,
  xp: 10,
};

const TASK_AREA_POINTS = 1;

function seedTasks() {
  const now = new Date().toISOString();

  return [
    {
      id: 't1',
      title: 'Terminar avance del proyecto',
      description: 'Completar la parte pendiente del frontend',
      dueDate: '',
      priority: 'alta',
      area: 'trabajo',
      completed: false,
      completedAt: null,
      createdAt: now,
    },
    {
      id: 't2',
      title: 'Repasar Base de Datos',
      description: 'Revisar consultas y ejercicios vistos en clase',
      dueDate: '',
      priority: 'media',
      area: 'trabajo',
      completed: false,
      completedAt: null,
      createdAt: now,
    },
    {
      id: 't3',
      title: 'Revisar calendario',
      description: 'Ver próximas entregas de la semana',
      dueDate: '',
      priority: 'baja',
      area: 'retrospeccion',
      completed: true,
      completedAt: now,
      createdAt: now,
    },
  ];
}

const TasksContext = createContext(null);

export function TasksProvider({ children }) {
  const [tasks, setTasks] = usePersistentState('up:tasks', seedTasks);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { applyReward, boostArea } = useAvatar();

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
            priority: taskData.priority || 'media',
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

      if (task.area) {
        boostArea(task.area, TASK_AREA_POINTS);
      }

      if (getAuthToken()) {
        try {
          const isNumeric = !String(id).startsWith('t');
          if (isNumeric) {
            await api.post(`/api/tasks/${id}/complete/`);
          }
        } catch (err) {
          console.error('Error al marcar tarea completada en backend:', err);
        }
      }
    },
    [tasks, setTasks, applyReward, boostArea],
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

      resetTasks: () => setTasks(seedTasks()),
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
