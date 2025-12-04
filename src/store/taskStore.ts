import { create } from 'zustand';
import type { Task, TaskStats, RecurrenceType } from '../types';
import { taskApi } from '../services/api';

// Helper to calculate next due date based on recurrence
function getNextDueDate(currentDueDate: string, recurrence: RecurrenceType): string {
  const date = new Date(currentDueDate);

  switch (recurrence) {
    case 'DAILY':
      date.setDate(date.getDate() + 1);
      break;
    case 'WEEKLY':
      date.setDate(date.getDate() + 7);
      break;
    case 'BIWEEKLY':
      date.setDate(date.getDate() + 14);
      break;
    case 'MONTHLY':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'QUARTERLY':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'YEARLY':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      return currentDueDate;
  }

  return date.toISOString().split('T')[0];
}

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
    const task = get().tasks.find((t) => t.id === id);
    const updated = await taskApi.complete(id);
    set({
      tasks: get().tasks.map((t) => (t.id === id ? updated : t)),
    });

    // If this is a recurring task, create the next occurrence
    if (task && task.recurrence && task.recurrence !== 'NONE' && task.dueDate) {
      const nextDueDate = getNextDueDate(task.dueDate, task.recurrence);

      // Check if we've passed the recurrence end date
      if (!task.recurrenceEndDate || new Date(nextDueDate) <= new Date(task.recurrenceEndDate)) {
        try {
          const nextTask = await taskApi.create({
            title: task.title,
            description: task.description,
            priority: task.priority,
            dueDate: nextDueDate,
            contactId: task.contactId,
            recurrence: task.recurrence,
            recurrenceEndDate: task.recurrenceEndDate,
            parentTaskId: task.parentTaskId || task.id,
          });
          set({ tasks: [...get().tasks, nextTask] });
        } catch (error) {
          console.error('Failed to create recurring task:', error);
        }
      }
    }

    get().fetchStats();
  },

  deleteTask: async (id) => {
    await taskApi.delete(id);
    set({ tasks: get().tasks.filter((t) => t.id !== id) });
    get().fetchStats();
  },
}));
