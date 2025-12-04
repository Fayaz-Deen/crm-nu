import { create } from 'zustand';
import type { Contact } from '../types';
import { db } from '../db';
import { contactApi } from '../services/api';

interface PaginationState {
  page: number;
  pageSize: number;
  totalCount: number;
  hasMore: boolean;
}

interface ContactState {
  contacts: Contact[];
  selectedContact: Contact | null;
  recentlyViewed: Contact[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  searchQuery: string;
  selectedTags: string[];
  pagination: PaginationState;
  fetchContacts: () => Promise<void>;
  loadMore: () => Promise<void>;
  getContact: (id: string) => Promise<Contact | null>;
  createContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Contact>;
  updateContact: (id: string, contact: Partial<Contact>) => Promise<Contact>;
  deleteContact: (id: string) => Promise<Contact | null>;
  restoreContact: (contact: Contact) => Promise<void>;
  bulkAddTags: (ids: string[], tags: string[]) => Promise<void>;
  addToRecentlyViewed: (contact: Contact) => void;
  setSelectedContact: (contact: Contact | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedTags: (tags: string[]) => void;
  resetPagination: () => void;
}

const DEFAULT_PAGE_SIZE = 20;

const MAX_RECENTLY_VIEWED = 10;

export const useContactStore = create<ContactState>((set, get) => ({
  contacts: [],
  selectedContact: null,
  recentlyViewed: [],
  isLoading: false,
  isLoadingMore: false,
  error: null,
  searchQuery: '',
  selectedTags: [],
  pagination: {
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalCount: 0,
    hasMore: true,
  },

  fetchContacts: async () => {
    set({ isLoading: true, error: null });
    try {
      const contacts = await contactApi.getAll();
      await db.contacts.bulkPut(contacts);
      set({
        contacts,
        isLoading: false,
        pagination: {
          page: 1,
          pageSize: DEFAULT_PAGE_SIZE,
          totalCount: contacts.length,
          hasMore: contacts.length >= DEFAULT_PAGE_SIZE,
        },
      });
    } catch (error) {
      const localContacts = await db.contacts.toArray();
      set({
        contacts: localContacts,
        isLoading: false,
        error: 'Using offline data',
        pagination: {
          page: 1,
          pageSize: DEFAULT_PAGE_SIZE,
          totalCount: localContacts.length,
          hasMore: false,
        },
      });
    }
  },

  loadMore: async () => {
    const { pagination, isLoadingMore, contacts } = get();
    if (isLoadingMore || !pagination.hasMore) return;

    set({ isLoadingMore: true });
    try {
      // For now, we load all contacts at once from API
      // In a real implementation, you'd add pagination params to the API
      const allContacts = await contactApi.getAll();
      const newContacts = allContacts.slice(contacts.length, contacts.length + DEFAULT_PAGE_SIZE);

      set((state) => ({
        contacts: [...state.contacts, ...newContacts],
        isLoadingMore: false,
        pagination: {
          ...state.pagination,
          page: state.pagination.page + 1,
          hasMore: contacts.length + newContacts.length < allContacts.length,
        },
      }));
    } catch {
      set({ isLoadingMore: false });
    }
  },

  getContact: async (id: string) => {
    try {
      const contact = await contactApi.getById(id);
      await db.contacts.put(contact);
      set({ selectedContact: contact });
      return contact;
    } catch {
      const localContact = await db.contacts.get(id);
      if (localContact) {
        set({ selectedContact: localContact });
        return localContact;
      }
      return null;
    }
  },

  createContact: async (contactData) => {
    // Optimistic update: add temp contact immediately
    const tempId = crypto.randomUUID();
    const tempContact: Contact = {
      ...contactData,
      id: tempId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add to UI immediately (optimistic)
    set((state) => ({
      contacts: [tempContact, ...state.contacts],
      pagination: {
        ...state.pagination,
        totalCount: state.pagination.totalCount + 1,
      },
    }));

    try {
      const contact = await contactApi.create(contactData);
      await db.contacts.put(contact);
      // Replace temp contact with real one
      set((state) => ({
        contacts: state.contacts.map((c) => (c.id === tempId ? contact : c)),
      }));
      return contact;
    } catch {
      // Keep the temp contact for offline support
      await db.contacts.put(tempContact);
      await db.syncQueue.add({
        type: 'create',
        entity: 'contact',
        entityId: tempContact.id,
        data: tempContact as unknown as Record<string, unknown>,
        createdAt: new Date(),
      });
      return tempContact;
    }
  },

  updateContact: async (id, contactData) => {
    // Store previous state for rollback
    const previousContacts = get().contacts;
    const existing = previousContacts.find((c) => c.id === id);
    if (!existing) throw new Error('Contact not found');

    // Optimistic update
    const optimisticUpdate = { ...existing, ...contactData, updatedAt: new Date().toISOString() };
    set((state) => ({
      contacts: state.contacts.map((c) => (c.id === id ? optimisticUpdate : c)),
      selectedContact: state.selectedContact?.id === id ? optimisticUpdate : state.selectedContact,
    }));

    try {
      const contact = await contactApi.update(id, contactData);
      await db.contacts.put(contact);
      set((state) => ({
        contacts: state.contacts.map((c) => (c.id === id ? contact : c)),
        selectedContact: state.selectedContact?.id === id ? contact : state.selectedContact,
      }));
      return contact;
    } catch {
      // Keep optimistic update for offline support
      await db.contacts.put(optimisticUpdate);
      await db.syncQueue.add({
        type: 'update',
        entity: 'contact',
        entityId: id,
        data: contactData as unknown as Record<string, unknown>,
        createdAt: new Date(),
      });
      return optimisticUpdate;
    }
  },

  deleteContact: async (id) => {
    // Store the contact for potential undo
    const deletedContact = get().contacts.find((c) => c.id === id) || null;

    // Optimistic delete - remove immediately
    set((state) => ({
      contacts: state.contacts.filter((c) => c.id !== id),
      selectedContact: state.selectedContact?.id === id ? null : state.selectedContact,
      recentlyViewed: state.recentlyViewed.filter((c) => c.id !== id),
      pagination: {
        ...state.pagination,
        totalCount: Math.max(0, state.pagination.totalCount - 1),
      },
    }));

    try {
      await contactApi.delete(id);
      await db.contacts.delete(id);
    } catch {
      // For offline support, keep the deletion queued
      await db.contacts.delete(id);
      await db.syncQueue.add({
        type: 'delete',
        entity: 'contact',
        entityId: id,
        data: {},
        createdAt: new Date(),
      });
    }

    return deletedContact;
  },

  restoreContact: async (contact) => {
    // Re-create the contact
    try {
      const restored = await contactApi.create(contact);
      await db.contacts.put(restored);
      set((state) => ({
        contacts: [restored, ...state.contacts],
        pagination: {
          ...state.pagination,
          totalCount: state.pagination.totalCount + 1,
        },
      }));
    } catch {
      // For offline support
      await db.contacts.put(contact);
      await db.syncQueue.add({
        type: 'create',
        entity: 'contact',
        entityId: contact.id,
        data: contact as unknown as Record<string, unknown>,
        createdAt: new Date(),
      });
      set((state) => ({
        contacts: [contact, ...state.contacts],
        pagination: {
          ...state.pagination,
          totalCount: state.pagination.totalCount + 1,
        },
      }));
    }
  },

  bulkAddTags: async (ids, tagsToAdd) => {
    // Optimistic update: add tags to contacts immediately
    set((state) => ({
      contacts: state.contacts.map((c) => {
        if (ids.includes(c.id)) {
          const newTags = [...new Set([...c.tags, ...tagsToAdd])];
          return { ...c, tags: newTags, updatedAt: new Date().toISOString() };
        }
        return c;
      }),
    }));

    try {
      const updatedContacts = await contactApi.bulkAddTags(ids, tagsToAdd);
      // Update with server response
      for (const contact of updatedContacts) {
        await db.contacts.put(contact);
      }
      set((state) => ({
        contacts: state.contacts.map((c) => {
          const updated = updatedContacts.find((u) => u.id === c.id);
          return updated || c;
        }),
      }));
    } catch {
      // Keep optimistic update for offline support
      const contacts = get().contacts;
      for (const id of ids) {
        const contact = contacts.find((c) => c.id === id);
        if (contact) {
          await db.contacts.put(contact);
          await db.syncQueue.add({
            type: 'update',
            entity: 'contact',
            entityId: id,
            data: { tags: contact.tags } as unknown as Record<string, unknown>,
            createdAt: new Date(),
          });
        }
      }
    }
  },

  addToRecentlyViewed: (contact) => {
    set((state) => {
      // Remove if already exists, then add to front
      const filtered = state.recentlyViewed.filter((c) => c.id !== contact.id);
      return {
        recentlyViewed: [contact, ...filtered].slice(0, MAX_RECENTLY_VIEWED),
      };
    });
  },

  setSelectedContact: (contact) => set({ selectedContact: contact }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedTags: (tags) => set({ selectedTags: tags }),
  resetPagination: () => set({
    pagination: {
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      totalCount: 0,
      hasMore: true,
    },
  }),
}));
