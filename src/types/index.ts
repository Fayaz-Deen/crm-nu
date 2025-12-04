export interface User {
  id: string;
  email: string;
  name: string;
  profilePicture?: string;
  timezone: string;
  settings: UserSettings;
  emailVerified?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettings {
  birthdayReminderDays: number;
  anniversaryReminderDays: number;
  defaultFollowupDays: number;
  theme: 'light' | 'dark' | 'system';
  notificationPrefs: {
    push: boolean;
    email: boolean;
  };
}

export interface Contact {
  id: string;
  userId: string;
  name: string;
  emails: string[];
  phones: string[];
  whatsappNumber?: string;
  instagramHandle?: string;
  company?: string;
  tags: string[];
  address?: string;
  notes?: string;
  birthday?: string;
  anniversary?: string;
  profilePicture?: string;
  lastContactedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type MeetingMedium =
  | 'phone_call'
  | 'whatsapp'
  | 'email'
  | 'sms'
  | 'in_person'
  | 'video_call'
  | 'instagram_dm'
  | 'other';

export interface Meeting {
  id: string;
  contactId: string;
  userId: string;
  meetingDate: string;
  medium: MeetingMedium;
  notes?: string;
  outcome?: string;
  followupDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type ReminderType = 'birthday' | 'anniversary' | 'followup' | 'no_contact';
export type ReminderStatus = 'pending' | 'sent' | 'dismissed';

export interface Reminder {
  id: string;
  userId: string;
  contactId: string;
  type: ReminderType;
  scheduledAt: string;
  sentAt?: string;
  status: ReminderStatus;
  createdAt: string;
}

export interface Share {
  id: string;
  contactId: string;
  ownerUserId: string;
  sharedWithUserId: string;
  permission: 'view' | 'view_add';
  expiresAt?: string;
  note?: string;
  createdAt: string;
}

export interface ShareResponse {
  id: string;
  contactId: string;
  contactName: string;
  ownerUserId: string;
  ownerName: string;
  ownerEmail: string;
  sharedWithUserId: string;
  sharedWithName: string;
  sharedWithEmail: string;
  permission: string;
  expiresAt?: string;
  note?: string;
  createdAt: string;
}

export interface MessageTemplate {
  id: string;
  userId: string;
  name: string;
  type: 'followup' | 'birthday' | 'anniversary' | 'custom';
  content: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, string>;
}

// Task types
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type RecurrenceType = 'NONE' | 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export interface Task {
  id: string;
  title: string;
  description?: string;
  contactId?: string;
  contactName?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  completedAt?: string;
  recurrence?: RecurrenceType;
  recurrenceEndDate?: string;
  parentTaskId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  dueToday: number;
}

// Tag types
export interface Tag {
  id: string;
  name: string;
  color: string;
  description?: string;
  contactCount: number;
  createdAt: string;
}

// Contact Group types
export interface ContactGroup {
  id: string;
  name: string;
  description?: string;
  color?: string;
  contactIds: string[];
  contactCount: number;
  createdAt: string;
  updatedAt: string;
}

// Calendar types
export type CalendarEventType = 'MEETING' | 'CALL' | 'VIDEO_CALL' | 'FOLLOW_UP' | 'OTHER';
export type CalendarEventStatus = 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  contactId?: string;
  contactName?: string;
  startTime: string;
  endTime: string;
  location?: string;
  meetLink?: string;
  type: CalendarEventType;
  status: CalendarEventStatus;
  attendees: string[];
  reminderMinutes?: number;
  createdAt: string;
  updatedAt: string;
}

// Activity types
export interface Activity {
  id: string;
  type: 'MEETING' | 'TASK' | 'CONTACT_CREATED';
  description: string;
  contactId?: string;
  contactName?: string;
  timestamp: string;
  details?: Record<string, unknown>;
}
