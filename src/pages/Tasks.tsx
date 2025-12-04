import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, CheckCircle2, Circle, Clock, AlertTriangle, ChevronRight } from 'lucide-react';
import { Button, Card, Modal, Input, Select, Textarea } from '../components/ui';
import { useTaskStore } from '../store/taskStore';
import { useContactStore } from '../store/contactStore';
import type { Task, TaskPriority, TaskStatus } from '../types';

const priorityColors: Record<TaskPriority, string> = {
  LOW: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  MEDIUM: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  URGENT: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

const statusIcons: Record<TaskStatus, React.ReactNode> = {
  PENDING: <Circle className="h-5 w-5 text-gray-400" />,
  IN_PROGRESS: <Clock className="h-5 w-5 text-blue-500" />,
  COMPLETED: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  CANCELLED: <Circle className="h-5 w-5 text-gray-300 line-through" />,
};

export function Tasks() {
  const { tasks, stats, isLoading, fetchActive, fetchStats, createTask, completeTask } = useTaskStore();
  const { contacts, fetchContacts } = useContactStore();
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'overdue' | 'completed'>('active');
  const [searchParams, setSearchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as TaskPriority,
    dueDate: '',
    contactId: '',
  });

  // Handle action query param
  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setShowModal(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    fetchActive();
    fetchStats();
    fetchContacts();
  }, [fetchActive, fetchStats, fetchContacts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTask({
      ...formData,
      contactId: formData.contactId || undefined,
    });
    setShowModal(false);
    setFormData({ title: '', description: '', priority: 'MEDIUM', dueDate: '', contactId: '' });
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'active') return task.status !== 'COMPLETED' && task.status !== 'CANCELLED';
    if (filter === 'completed') return task.status === 'COMPLETED';
    if (filter === 'overdue') {
      return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';
    }
    return true;
  });

  const isOverdue = (task: Task) => {
    return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[hsl(var(--background))] border-b border-[hsl(var(--border))]">
        <div className="px-4 py-4 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Tasks</h1>
            <Button size="sm" onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-4 gap-2 mt-4">
              <div className="bg-[hsl(var(--card))] rounded-xl p-3 text-center border border-[hsl(var(--border))]">
                <div className="text-xl font-bold">{stats.pending}</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Pending</div>
              </div>
              <div className="bg-[hsl(var(--card))] rounded-xl p-3 text-center border border-[hsl(var(--border))]">
                <div className="text-xl font-bold text-blue-500">{stats.inProgress}</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">In Progress</div>
              </div>
              <div className="bg-[hsl(var(--card))] rounded-xl p-3 text-center border border-[hsl(var(--border))]">
                <div className="text-xl font-bold text-red-500">{stats.overdue}</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Overdue</div>
              </div>
              <div className="bg-[hsl(var(--card))] rounded-xl p-3 text-center border border-[hsl(var(--border))]">
                <div className="text-xl font-bold text-green-500">{stats.completed}</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Done</div>
              </div>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0">
            {(['active', 'overdue', 'completed', 'all'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === f
                    ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                    : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="p-4 lg:p-8 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[hsl(var(--primary))] border-t-transparent" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <Card className="p-8">
            <div className="flex flex-col items-center justify-center text-center">
              <CheckCircle2 className="h-12 w-12 text-[hsl(var(--muted-foreground))] mb-3" />
              <p className="text-[hsl(var(--muted-foreground))] font-medium">No tasks found</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                {filter === 'active' ? 'Create a new task to get started' : 'No tasks match this filter'}
              </p>
            </div>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card
              key={task.id}
              className={`p-4 transition-all hover:shadow-md ${isOverdue(task) ? 'border-red-300 dark:border-red-800 border-2' : ''}`}
            >
              <div className="flex items-start gap-4">
                <button
                  onClick={() => task.status !== 'COMPLETED' && completeTask(task.id)}
                  className="mt-0.5 touch-manipulation flex-shrink-0"
                  disabled={task.status === 'COMPLETED'}
                >
                  {statusIcons[task.status]}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`font-medium ${task.status === 'COMPLETED' ? 'line-through text-[hsl(var(--muted-foreground))]' : ''}`}>
                      {task.title}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${priorityColors[task.priority]}`}>
                      {task.priority}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center flex-wrap gap-3 mt-3 text-xs text-[hsl(var(--muted-foreground))]">
                    {task.dueDate && (
                      <span className={`flex items-center gap-1 ${isOverdue(task) ? 'text-red-500 font-medium' : ''}`}>
                        {isOverdue(task) && <AlertTriangle className="h-3 w-3" />}
                        Due {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                    {task.contactName && (
                      <span className="flex items-center gap-1">
                        <ChevronRight className="h-3 w-3" />
                        {task.contactName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create Task Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Task">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="What needs to be done?"
          />
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Add details..."
            rows={3}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Priority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </Select>
            <Input
              type="date"
              label="Due Date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>
          <Select
            label="Related Contact"
            value={formData.contactId}
            onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
          >
            <option value="">None</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name}
              </option>
            ))}
          </Select>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Create Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Tasks;
