import { useState, useEffect } from 'react';
import { Plus, Video, Phone, MapPin, Clock, ExternalLink, Users, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, Card, Modal, Input, Select, Textarea } from '../components/ui';
import { useCalendarStore } from '../store/calendarStore';
import { useContactStore } from '../store/contactStore';
import type { CalendarEvent, CalendarEventType } from '../types';

const eventTypeIcons: Record<CalendarEventType, React.ReactNode> = {
  VIDEO_CALL: <Video className="h-4 w-4" />,
  CALL: <Phone className="h-4 w-4" />,
  MEETING: <Users className="h-4 w-4" />,
  FOLLOW_UP: <Clock className="h-4 w-4" />,
  OTHER: <CalendarIcon className="h-4 w-4" />,
};

const eventTypeColors: Record<CalendarEventType, string> = {
  VIDEO_CALL: 'bg-blue-500',
  CALL: 'bg-green-500',
  MEETING: 'bg-purple-500',
  FOLLOW_UP: 'bg-orange-500',
  OTHER: 'bg-gray-500',
};

export function Calendar() {
  const { upcomingEvents, isLoading, fetchEvents, fetchUpcoming, createEvent } = useCalendarStore();
  const { contacts, fetchContacts } = useContactStore();
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'upcoming' | 'month'>('upcoming');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'VIDEO_CALL' as CalendarEventType,
    startTime: '',
    endTime: '',
    location: '',
    contactId: '',
    createMeetLink: true,
    attendees: '',
    reminderMinutes: 15,
  });

  useEffect(() => {
    fetchEvents();
    fetchUpcoming(10);
    fetchContacts();
  }, [fetchEvents, fetchUpcoming, fetchContacts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newEvent = await createEvent({
      ...formData,
      contactId: formData.contactId || undefined,
      attendees: formData.attendees.split(',').map(a => a.trim()).filter(Boolean),
      createMeetLink: formData.type === 'VIDEO_CALL' && formData.createMeetLink,
    });
    setShowModal(false);
    setFormData({
      title: '',
      description: '',
      type: 'VIDEO_CALL',
      startTime: '',
      endTime: '',
      location: '',
      contactId: '',
      createMeetLink: true,
      attendees: '',
      reminderMinutes: 15,
    });
    // Show meet link if created
    if (newEvent.meetLink) {
      alert(`Meeting created! Google Meet link: ${newEvent.meetLink}`);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const groupEventsByDate = (events: CalendarEvent[]) => {
    const grouped: Record<string, CalendarEvent[]> = {};
    events.forEach(event => {
      const dateKey = new Date(event.startTime).toDateString();
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(event);
    });
    return grouped;
  };

  const groupedUpcoming = groupEventsByDate(upcomingEvents);

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[hsl(var(--background))] px-4 py-3 border-b border-[hsl(var(--border))]">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Calendar</h1>
          <Button size="sm" onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Event
          </Button>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setView('upcoming')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'upcoming'
                ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setView('month')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'month'
                ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
            }`}
          >
            Month View
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[hsl(var(--primary))] border-t-transparent mx-auto" />
          </div>
        ) : view === 'upcoming' ? (
          /* Upcoming Events View */
          <div className="space-y-6">
            {Object.keys(groupedUpcoming).length === 0 ? (
              <Card className="p-8 text-center">
                <CalendarIcon className="h-12 w-12 mx-auto text-[hsl(var(--muted-foreground))] mb-3" />
                <p className="text-[hsl(var(--muted-foreground))]">No upcoming events</p>
              </Card>
            ) : (
              Object.entries(groupedUpcoming).map(([dateKey, dayEvents]) => (
                <div key={dateKey}>
                  <div className={`text-sm font-medium mb-2 ${isToday(dayEvents[0].startTime) ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'}`}>
                    {isToday(dayEvents[0].startTime) ? 'Today' : formatDate(dayEvents[0].startTime)}
                  </div>
                  <div className="space-y-3">
                    {dayEvents.map((event) => (
                      <Card key={event.id} className="p-4">
                        <div className="flex gap-3">
                          <div className={`w-1 rounded-full ${eventTypeColors[event.type]}`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {eventTypeIcons[event.type]}
                              <h3 className="font-medium">{event.title}</h3>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                              <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
                              {event.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {event.location}
                                </span>
                              )}
                            </div>
                            {event.meetLink && (
                              <a
                                href={event.meetLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium"
                              >
                                <Video className="h-4 w-4" />
                                Join Meet
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            {event.attendees && event.attendees.length > 0 && (
                              <div className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                                <Users className="h-3 w-3 inline mr-1" />
                                {event.attendees.join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Month View */
          <div>
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
                className="p-2 rounded-lg hover:bg-[hsl(var(--muted))]"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="font-medium">
                {selectedDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
                className="p-2 rounded-lg hover:bg-[hsl(var(--muted))]"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            {/* Simple month grid would go here */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="py-2 font-medium text-[hsl(var(--muted-foreground))]">{day}</div>
              ))}
            </div>
            <p className="text-center text-sm text-[hsl(var(--muted-foreground))] mt-4">
              Month view coming soon. Use Upcoming view for now.
            </p>
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Event">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="Event title"
          />

          <Select
            label="Event Type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as CalendarEventType })}
          >
            <option value="VIDEO_CALL">Video Call</option>
            <option value="CALL">Phone Call</option>
            <option value="MEETING">In-Person Meeting</option>
            <option value="FOLLOW_UP">Follow Up</option>
            <option value="OTHER">Other</option>
          </Select>

          {formData.type === 'VIDEO_CALL' && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={formData.createMeetLink}
                onChange={(e) => setFormData({ ...formData, createMeetLink: e.target.checked })}
                className="rounded border-[hsl(var(--border))]"
              />
              Generate Google Meet link
            </label>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="datetime-local"
              label="Start Time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              required
            />
            <Input
              type="datetime-local"
              label="End Time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              required
            />
          </div>

          <Input
            label="Location (Optional)"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Meeting room or address"
          />

          <Input
            label="Attendees (comma-separated emails)"
            value={formData.attendees}
            onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
            placeholder="john@example.com, jane@example.com"
          />

          <Select
            label="Related Contact (Optional)"
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

          <Select
            label="Reminder"
            value={formData.reminderMinutes.toString()}
            onChange={(e) => setFormData({ ...formData, reminderMinutes: parseInt(e.target.value) })}
          >
            <option value="0">No reminder</option>
            <option value="5">5 minutes before</option>
            <option value="15">15 minutes before</option>
            <option value="30">30 minutes before</option>
            <option value="60">1 hour before</option>
            <option value="1440">1 day before</option>
          </Select>

          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Add meeting notes or agenda..."
            rows={3}
          />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Create Event
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Calendar;
