import { create } from 'zustand';
import type { CalendarEvent } from '../types';
import { calendarApi } from '../services/api';

interface CalendarStore {
  events: CalendarEvent[];
  todayEvents: CalendarEvent[];
  upcomingEvents: CalendarEvent[];
  isLoading: boolean;
  error: string | null;
  fetchEvents: () => Promise<void>;
  fetchToday: () => Promise<void>;
  fetchUpcoming: (limit?: number) => Promise<void>;
  fetchByDateRange: (start: string, end: string) => Promise<void>;
  createEvent: (data: Partial<CalendarEvent> & { createMeetLink?: boolean }) => Promise<CalendarEvent>;
  updateEvent: (id: string, data: Partial<CalendarEvent>) => Promise<void>;
  cancelEvent: (id: string) => Promise<void>;
  completeEvent: (id: string, notes?: string) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
}

export const useCalendarStore = create<CalendarStore>((set, get) => ({
  events: [],
  todayEvents: [],
  upcomingEvents: [],
  isLoading: false,
  error: null,

  fetchEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const events = await calendarApi.getAll();
      set({ events, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchToday: async () => {
    try {
      const todayEvents = await calendarApi.getToday();
      set({ todayEvents });
    } catch (error) {
      console.error('Failed to fetch today events:', error);
    }
  },

  fetchUpcoming: async (limit = 10) => {
    try {
      const upcomingEvents = await calendarApi.getUpcoming(limit);
      set({ upcomingEvents });
    } catch (error) {
      console.error('Failed to fetch upcoming events:', error);
    }
  },

  fetchByDateRange: async (start, end) => {
    set({ isLoading: true, error: null });
    try {
      const events = await calendarApi.getByDateRange(start, end);
      set({ events, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createEvent: async (data) => {
    const event = await calendarApi.create(data);
    set({ events: [...get().events, event] });
    return event;
  },

  updateEvent: async (id, data) => {
    const updated = await calendarApi.update(id, data);
    set({
      events: get().events.map((e) => (e.id === id ? updated : e)),
    });
  },

  cancelEvent: async (id) => {
    await calendarApi.cancel(id);
    set({
      events: get().events.map((e) =>
        e.id === id ? { ...e, status: 'CANCELLED' as const } : e
      ),
    });
  },

  completeEvent: async (id, notes) => {
    const updated = await calendarApi.complete(id, notes);
    set({
      events: get().events.map((e) => (e.id === id ? updated : e)),
    });
  },

  deleteEvent: async (id) => {
    await calendarApi.delete(id);
    set({ events: get().events.filter((e) => e.id !== id) });
  },
}));
