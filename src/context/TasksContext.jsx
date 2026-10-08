import { createContext, useCallback, useContext, useMemo } from 'react';
import { usePersistentState } from '../hooks/usePersistentState';
import { useAvatar } from './AvatarContext';

export const TASK_PRIORITIES = {
  alta: { label: 'Alta', color: 'coral' },
  media: { label: 'Media', color: 'amber' },
  baja: { label: 'Baja', color: 'green' },
};

function seedTasks() {
  return [
    {
      id: 't1',
      title: 'Terminar avance del proyecto',
      description: 'Completar la parte pendiente del frontend',
      dueDate: '',
      priority: 'alta',
      completed: false,
      createdAt: Date.now(),
    },
    {
      id: 't2',
      title: 'Repasar Base de Datos',
      description: 'Revisar consultas y ejercicios vistos en clase',
      dueDate: '',
      priority: 'media',
      completed: false,
      createdAt: Date.now(),
    },
    {
      id: 't3',
      title: 'Revisar calendario',
      description: 'Ver próximas entregas de la semana',
      dueDate: '',
      priority: 'baja',
      completed: true,
      createdAt: Date.now(),
    },
  ];
}

const TasksContext = createContext(null);

export function TasksProvider({ children }) {
  const [tasks, setTasks] = usePersistentState('up:tasks', seedTasks);
  const { applyReward } = useAvatar();

  const addTask = useCallback(
    (task) => {
      setTasks((prev) => [
        ...prev,
        {
          ...task,
          id: `t-${Date.now()}`,
          completed: false,
          createdAt: Date.now(),
        },
      ]);
    },
    [setTasks],
  );

  const updateTask = useCallback(
    (id, patch) => {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === id ? { ...task, ...patch } : task,
        ),
      );
    },
    [setTasks],
  );

  const removeTask = useCallback(
    (id) => {
      setTasks((prev) => prev.filter((task) => task.id !== id));
    },
    [setTasks],
  );

  const completeTask = useCallback(
    (id) => {
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id !== id || task.completed) return task;

          applyReward({
            vida: 5,
            alimento: 5,
            xp: 10,
          });

          return {
            ...task,
            completed: true,
          };
        }),
      );
    },
    [setTasks, applyReward],
  );

  const reopenTask = useCallback(
    (id) => {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === id ? { ...task, completed: false } : task,
        ),
      );
    },
    [setTasks],
  );

  const pendingTasks = useMemo(
    () => tasks.filter((task) => !task.completed),
    [tasks],
  );

  const completedTasks = useMemo(
    () => tasks.filter((task) => task.completed),
    [tasks],
  );

  const value = useMemo(
    () => ({
      tasks,
      pendingTasks,
      completedTasks,
      addTask,
      updateTask,
      removeTask,
      completeTask,
      reopenTask,
      resetTasks: () => setTasks(seedTasks()),
    }),
    [
      tasks,
      pendingTasks,
      completedTasks,
      addTask,
      updateTask,
      removeTask,
      completeTask,
      reopenTask,
      setTasks,
    ],
  );

  return (
    <TasksContext.Provider value={value}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TasksContext);

  if (!ctx) {
    throw new Error('useTasks debe usarse dentro de <TasksProvider>');
  }

  return ctx;
}