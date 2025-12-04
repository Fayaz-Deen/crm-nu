import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, ChevronRight } from 'lucide-react';
import { Button, Card, Modal, Input, Textarea } from '../components/ui';
import { groupApi, contactApi } from '../services/api';
import type { ContactGroup, Contact } from '../types';

const colorOptions = [
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Purple', value: '#A855F7' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Gray', value: '#6B7280' },
];

export function Groups() {
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ContactGroup | null>(null);
  const [groupContacts, setGroupContacts] = useState<Contact[]>([]);
  const [editingGroup, setEditingGroup] = useState<ContactGroup | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
  });

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const data = await groupApi.getAll();
      setGroups(data);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const data = await contactApi.getAll();
      setContacts(data);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchContacts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGroup) {
        await groupApi.update(editingGroup.id, formData);
      } else {
        await groupApi.create(formData);
      }
      setShowModal(false);
      setEditingGroup(null);
      setFormData({ name: '', description: '', color: '#3B82F6' });
      fetchGroups();
    } catch (error) {
      console.error('Failed to save group:', error);
    }
  };

  const handleEdit = (group: ContactGroup) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
      color: group.color || '#3B82F6',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this group?')) {
      try {
        await groupApi.delete(id);
        fetchGroups();
      } catch (error) {
        console.error('Failed to delete group:', error);
      }
    }
  };

  const openNewModal = () => {
    setEditingGroup(null);
    setFormData({ name: '', description: '', color: '#3B82F6' });
    setShowModal(true);
  };

  const viewMembers = async (group: ContactGroup) => {
    setSelectedGroup(group);
    try {
      const members = await groupApi.getContacts(group.id);
      setGroupContacts(members);
      setShowMembersModal(true);
    } catch (error) {
      console.error('Failed to fetch group members:', error);
    }
  };

  const addContactToGroup = async (contactId: string) => {
    if (!selectedGroup) return;
    try {
      await groupApi.addContact(selectedGroup.id, contactId);
      const members = await groupApi.getContacts(selectedGroup.id);
      setGroupContacts(members);
      fetchGroups();
    } catch (error) {
      console.error('Failed to add contact:', error);
    }
  };

  const removeContactFromGroup = async (contactId: string) => {
    if (!selectedGroup) return;
    try {
      await groupApi.removeContact(selectedGroup.id, contactId);
      const members = await groupApi.getContacts(selectedGroup.id);
      setGroupContacts(members);
      fetchGroups();
    } catch (error) {
      console.error('Failed to remove contact:', error);
    }
  };

  const getAvailableContacts = () => {
    const memberIds = new Set(groupContacts.map(c => c.id));
    return contacts.filter(c => !memberIds.has(c.id));
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[hsl(var(--background))] px-4 py-3 border-b border-[hsl(var(--border))]">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Groups</h1>
          <Button size="sm" onClick={openNewModal}>
            <Plus className="h-4 w-4 mr-1" />
            Add Group
          </Button>
        </div>
      </div>

      {/* Group List */}
      <div className="p-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[hsl(var(--primary))] border-t-transparent mx-auto" />
          </div>
        ) : groups.length === 0 ? (
          <Card className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto text-[hsl(var(--muted-foreground))] mb-3" />
            <p className="text-[hsl(var(--muted-foreground))]">No groups yet</p>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
              Create groups to organize your contacts
            </p>
          </Card>
        ) : (
          groups.map((group) => (
            <Card key={group.id} className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: (group.color || '#3B82F6') + '20' }}
                >
                  <Users
                    className="h-5 w-5"
                    style={{ color: group.color || '#3B82F6' }}
                  />
                </div>
                <div className="flex-1 min-w-0" onClick={() => viewMembers(group)}>
                  <h3 className="font-medium">{group.name}</h3>
                  {group.description && (
                    <p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-1">
                      {group.description}
                    </p>
                  )}
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                    {group.contactCount} member{group.contactCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => viewMembers(group)}
                  className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(group)}
                    className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(group.id)}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Group Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingGroup ? 'Edit Group' : 'New Group'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Group Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g., Work, Family, Clients"
          />

          <div>
            <label className="block text-sm font-medium mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    formData.color === color.value
                      ? 'ring-2 ring-offset-2 ring-[hsl(var(--primary))] scale-110'
                      : ''
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <Textarea
            label="Description (Optional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="What is this group for?"
            rows={2}
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editingGroup ? 'Save Changes' : 'Create Group'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Group Members Modal */}
      <Modal
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        title={selectedGroup?.name || 'Group Members'}
      >
        <div className="space-y-4">
          {/* Current Members */}
          <div>
            <h4 className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-2">
              Members ({groupContacts.length})
            </h4>
            {groupContacts.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-4">
                No members in this group
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {groupContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-[hsl(var(--muted))]"
                  >
                    <span className="text-sm font-medium">{contact.name}</span>
                    <button
                      onClick={() => removeContactFromGroup(contact.id)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Members */}
          <div>
            <h4 className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-2">
              Add Members
            </h4>
            {getAvailableContacts().length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-4">
                All contacts are already in this group
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {getAvailableContacts().map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-2 rounded-lg border border-[hsl(var(--border))]"
                  >
                    <span className="text-sm">{contact.name}</span>
                    <button
                      onClick={() => addContactToGroup(contact.id)}
                      className="text-xs text-[hsl(var(--primary))] hover:underline"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowMembersModal(false)}
          >
            Done
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default Groups;
