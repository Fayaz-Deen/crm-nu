import type { AuthResponse, Contact, Meeting, User, Reminder, Task, TaskStats, Tag, ContactGroup, CalendarEvent, Activity, GoogleCalendarSyncStatus, GoogleCalendarSyncResult } from '../types';
import { useAuthStore } from '../store/authStore';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = useAuthStore.getState().token;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        return this.request(endpoint, options);
      }
      useAuthStore.getState().logout();
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data: AuthResponse = await response.json();
        useAuthStore.getState().setAuth(data.user, data.token, data.refreshToken);
        return true;
      }
    } catch {
      // Refresh failed
    }
    return false;
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

const api = new ApiClient();

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  register: (email: string, password: string, name: string, birthday?: string, anniversary?: string) =>
    api.post<AuthResponse>('/auth/register', { email, password, name, birthday, anniversary }),

  googleAuth: (params: { code?: string; idToken?: string; redirectUri?: string }) =>
    api.post<AuthResponse>('/auth/google', params),

  verifyEmail: (token: string) =>
    api.post<{ message: string }>('/auth/verify-email', { token }),

  resendVerification: (email: string) =>
    api.post<{ message: string }>('/auth/resend-verification', { email }),

  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post<{ message: string }>('/auth/reset-password', { token, password }),

  getProfile: () => api.get<User>('/auth/profile'),

  updateProfile: (data: Partial<User>) =>
    api.put<User>('/auth/profile', data),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<{ message: string }>('/auth/change-password', { currentPassword, newPassword }),

  deleteAccount: () => api.delete<{ message: string }>('/auth/account'),
};

export const contactApi = {
  getAll: () => api.get<Contact[]>('/contacts'),

  getById: (id: string) => api.get<Contact>(`/contacts/${id}`),

  create: (data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) =>
    api.post<Contact>('/contacts', data),

  update: (id: string, data: Partial<Contact>) =>
    api.put<Contact>(`/contacts/${id}`, data),

  delete: (id: string) => api.delete<void>(`/contacts/${id}`),

  bulkUpdate: (ids: string[], data: Partial<Contact>) =>
    api.put<Contact[]>('/contacts/bulk', { ids, ...data }),

  bulkAddTags: (ids: string[], tags: string[]) =>
    api.post<Contact[]>('/contacts/bulk/tags', { ids, tags }),

  search: (query: string, tags?: string[]) =>
    api.get<Contact[]>(`/contacts/search?q=${encodeURIComponent(query)}${tags?.length ? `&tags=${tags.join(',')}` : ''}`),

  getSharedWithMe: () => api.get<Contact[]>('/contacts/shared'),

  shareContact: (contactId: string, email: string, permission: 'view' | 'view_add', expiresAt?: string) =>
    api.post<void>(`/contacts/${contactId}/share`, { email, permission, expiresAt }),

  revokeShare: (contactId: string, userId: string) =>
    api.delete<void>(`/contacts/${contactId}/share/${userId}`),
};

export const meetingApi = {
  getAll: () => api.get<Meeting[]>('/meetings'),

  getByContact: (contactId: string) =>
    api.get<Meeting[]>(`/meetings/contact/${contactId}`),

  getUpcomingFollowups: () =>
    api.get<Meeting[]>('/meetings/followups'),

  create: (data: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>) =>
    api.post<Meeting>('/meetings', data),

  update: (id: string, data: Partial<Meeting>) =>
    api.put<Meeting>(`/meetings/${id}`, data),

  delete: (id: string) => api.delete<void>(`/meetings/${id}`),
};

export const reminderApi = {
  getAll: () => api.get<Reminder[]>('/reminders'),

  getPending: () => api.get<Reminder[]>('/reminders/pending'),

  dismiss: (id: string) =>
    api.put<Reminder>(`/reminders/${id}/dismiss`),
};

export const dashboardApi = {
  getStats: () =>
    api.get<{
      totalContacts: number;
      meetingsThisMonth: number;
      upcomingBirthdays: Contact[];
      upcomingAnniversaries: Contact[];
      pendingFollowups: Meeting[];
      recentlyContacted: Contact[];
      needsAttention: Contact[];
    }>('/dashboard/stats'),

  getMeetingsChart: () =>
    api.get<{ week: string; count: number }[]>('/dashboard/meetings-chart'),

  getMediumBreakdown: () =>
    api.get<{ medium: string; count: number }[]>('/dashboard/medium-breakdown'),

  getContactsOverTime: (period: 'week' | 'month' | 'year' = 'month') =>
    api.get<{ label: string; count: number }[]>(`/dashboard/contacts-over-time?period=${period}`),
};

// Task API
export const taskApi = {
  getAll: () => api.get<Task[]>('/tasks'),

  getById: (id: string) => api.get<Task>(`/tasks/${id}`),

  getActive: () => api.get<Task[]>('/tasks/active'),

  getByStatus: (status: string) => api.get<Task[]>(`/tasks/status/${status}`),

  getByContact: (contactId: string) => api.get<Task[]>(`/tasks/contact/${contactId}`),

  getOverdue: () => api.get<Task[]>('/tasks/overdue'),

  getDueToday: () => api.get<Task[]>('/tasks/today'),

  getStats: () => api.get<TaskStats>('/tasks/stats'),

  create: (data: Partial<Task>) => api.post<Task>('/tasks', data),

  update: (id: string, data: Partial<Task>) => api.put<Task>(`/tasks/${id}`, data),

  complete: (id: string) => api.post<Task>(`/tasks/${id}/complete`),

  delete: (id: string) => api.delete<void>(`/tasks/${id}`),
};

// Tag API
export const tagApi = {
  getAll: () => api.get<Tag[]>('/tags'),

  getById: (id: string) => api.get<Tag>(`/tags/${id}`),

  create: (data: Partial<Tag>) => api.post<Tag>('/tags', data),

  update: (id: string, data: Partial<Tag>) => api.put<Tag>(`/tags/${id}`, data),

  delete: (id: string) => api.delete<void>(`/tags/${id}`),
};

// Contact Group API
export const groupApi = {
  getAll: () => api.get<ContactGroup[]>('/groups'),

  getById: (id: string) => api.get<ContactGroup>(`/groups/${id}`),

  getContacts: (id: string) => api.get<Contact[]>(`/groups/${id}/contacts`),

  create: (data: Partial<ContactGroup>) => api.post<ContactGroup>('/groups', data),

  update: (id: string, data: Partial<ContactGroup>) => api.put<ContactGroup>(`/groups/${id}`, data),

  addContact: (groupId: string, contactId: string) =>
    api.post<ContactGroup>(`/groups/${groupId}/contacts/${contactId}`),

  removeContact: (groupId: string, contactId: string) =>
    api.delete<ContactGroup>(`/groups/${groupId}/contacts/${contactId}`),

  delete: (id: string) => api.delete<void>(`/groups/${id}`),
};

// Calendar API
export const calendarApi = {
  getAll: () => api.get<CalendarEvent[]>('/calendar'),

  getById: (id: string) => api.get<CalendarEvent>(`/calendar/${id}`),

  getByDateRange: (start: string, end: string) =>
    api.get<CalendarEvent[]>(`/calendar/range?start=${start}&end=${end}`),

  getUpcoming: (limit = 10) => api.get<CalendarEvent[]>(`/calendar/upcoming?limit=${limit}`),

  getToday: () => api.get<CalendarEvent[]>('/calendar/today'),

  getByContact: (contactId: string) => api.get<CalendarEvent[]>(`/calendar/contact/${contactId}`),

  create: (data: Partial<CalendarEvent> & { createMeetLink?: boolean }) =>
    api.post<CalendarEvent>('/calendar', data),

  update: (id: string, data: Partial<CalendarEvent>) =>
    api.put<CalendarEvent>(`/calendar/${id}`, data),

  cancel: (id: string) => api.post<void>(`/calendar/${id}/cancel`),

  complete: (id: string, notes?: string) =>
    api.post<CalendarEvent>(`/calendar/${id}/complete`, { notes }),

  delete: (id: string) => api.delete<void>(`/calendar/${id}`),

  exportIcs: () => api.get<string>('/calendar/export'),

  importIcs: (icsContent: string) => api.post<CalendarEvent[]>('/calendar/import', icsContent),
};

// Activity API
export const activityApi = {
  getRecent: (limit = 20) => api.get<Activity[]>(`/activity?limit=${limit}`),

  getByContact: (contactId: string, limit = 50) =>
    api.get<Activity[]>(`/activity/contact/${contactId}?limit=${limit}`),
};

// Contact Export/Import API additions
export const contactExportApi = {
  exportCsv: () => api.get<string>('/contacts/export/csv'),

  importCsv: (csvContent: string) => api.post<Contact[]>('/contacts/import/csv', csvContent),

  exportVCard: (contactId: string) => api.get<string>(`/contacts/${contactId}/vcard`),

  exportAllVCard: () => api.get<string>('/contacts/export/vcard'),

  findDuplicates: () => api.get<Contact[][]>('/contacts/duplicates'),

  mergeContacts: (primaryId: string, mergeIds: string[]) =>
    api.post<Contact>('/contacts/merge', { primaryId, mergeIds }),
};

// Global Search API
// TODO: Future AI integration placeholder
// - Add semantic search endpoint
// - Add natural language query processing
// - Add relevance-based result ranking
export const searchApi = {
  search: (query: string, limit = 20) =>
    api.get<Contact[]>(`/search?q=${encodeURIComponent(query)}&limit=${limit}`),
};

// Google Calendar Sync API
export const googleCalendarApi = {
  getAuthUrl: (redirectUri?: string) =>
    api.get<{ authUrl: string }>(`/calendar/google/auth-url${redirectUri ? `?redirectUri=${encodeURIComponent(redirectUri)}` : ''}`),

  connect: (code: string, redirectUri?: string) =>
    api.post<GoogleCalendarSyncStatus>('/calendar/google/connect', { code, redirectUri }),

  disconnect: () =>
    api.post<void>('/calendar/google/disconnect'),

  getStatus: () =>
    api.get<GoogleCalendarSyncStatus>('/calendar/google/status'),

  triggerSync: () =>
    api.post<GoogleCalendarSyncResult>('/calendar/google/sync'),
};

export { api };
export default api;
