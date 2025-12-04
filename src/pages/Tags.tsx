import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag as TagIcon } from 'lucide-react';
import { Button, Card, Modal, Input } from '../components/ui';
import { tagApi } from '../services/api';
import type { Tag } from '../types';

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

export function Tags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    description: '',
  });

  const fetchTags = async () => {
    try {
      setIsLoading(true);
      const data = await tagApi.getAll();
      setTags(data);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTag) {
        await tagApi.update(editingTag.id, formData);
      } else {
        await tagApi.create(formData);
      }
      setShowModal(false);
      setEditingTag(null);
      setFormData({ name: '', color: '#3B82F6', description: '' });
      fetchTags();
    } catch (error) {
      console.error('Failed to save tag:', error);
    }
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      color: tag.color,
      description: tag.description || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this tag?')) {
      try {
        await tagApi.delete(id);
        fetchTags();
      } catch (error) {
        console.error('Failed to delete tag:', error);
      }
    }
  };

  const openNewModal = () => {
    setEditingTag(null);
    setFormData({ name: '', color: '#3B82F6', description: '' });
    setShowModal(true);
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[hsl(var(--background))] px-4 py-3 border-b border-[hsl(var(--border))]">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Tags</h1>
          <Button size="sm" onClick={openNewModal}>
            <Plus className="h-4 w-4 mr-1" />
            Add Tag
          </Button>
        </div>
      </div>

      {/* Tag List */}
      <div className="p-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[hsl(var(--primary))] border-t-transparent mx-auto" />
          </div>
        ) : tags.length === 0 ? (
          <Card className="p-8 text-center">
            <TagIcon className="h-12 w-12 mx-auto text-[hsl(var(--muted-foreground))] mb-3" />
            <p className="text-[hsl(var(--muted-foreground))]">No tags yet</p>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
              Create tags to organize your contacts
            </p>
          </Card>
        ) : (
          tags.map((tag) => (
            <Card key={tag.id} className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: tag.color + '20' }}
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">{tag.name}</h3>
                  {tag.description && (
                    <p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-1">
                      {tag.description}
                    </p>
                  )}
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                    {tag.contactCount} contact{tag.contactCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(tag)}
                    className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(tag.id)}
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

      {/* Create/Edit Tag Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingTag ? 'Edit Tag' : 'New Tag'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Tag Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g., VIP, Lead, Friend"
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

          <Input
            label="Description (Optional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="What is this tag for?"
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
              {editingTag ? 'Save Changes' : 'Create Tag'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Tags;
