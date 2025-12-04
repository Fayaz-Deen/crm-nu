import { create } from 'zustand';
import type { Task, TaskStats } from '../types';
import { taskApi } from '../services/api';

interface TaskStore {
  tasks: Task[];
  stats: TaskStats | null;
  isLoading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  fetchActive: () => Promise<void>;
  fetchStats: () => Promise<void>;
  createTask: (data: Partial<Task>) => Promise<Task>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  stats: null,
  isLoading: false,
  error: null,

  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const tasks = await taskApi.getAll();
      set({ tasks, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchActive: async () => {
    set({ isLoading: true, error: null });
    try {
      const tasks = await taskApi.getActive();
      set({ tasks, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchStats: async () => {
    try {
      const stats = await taskApi.getStats();
      set({ stats });
    } catch (error) {
      console.error('Failed to fetch task stats:', error);
    }
  },

  createTask: async (data) => {
    const task = await taskApi.create(data);
    set({ tasks: [...get().tasks, task] });
    get().fetchStats();
    return task;
  },

  updateTask: async (id, data) => {
    const updated = await taskApi.update(id, data);
    set({
      tasks: get().tasks.map((t) => (t.id === id ? updated : t)),
    });
    get().fetchStats();
  },

  completeTask: async (id) => {
    const updated = await taskApi.complete(id);
    set({
      tasks: get().tasks.map((t) => (t.id === id ? updated : t)),
    });
    get().fetchStats();
  },

  deleteTask: async (id) => {
    await taskApi.delete(id);
    set({ tasks: get().tasks.filter((t) => t.id !== id) });
    get().fetchStats();
  },
}));
