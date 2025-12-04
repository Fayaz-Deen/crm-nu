import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, Phone, Mail, MessageCircle, Users, Upload, UserPlus, Trash2, CheckSquare, Square, X, Loader2, Gift, Calendar, Clock, History, Tags, AlertCircle } from 'lucide-react';
import { Button, Input, Card, Avatar, Badge, Modal, SkeletonContactCard } from '../components/ui';
import { useContactStore } from '../store/contactStore';
import { ContactForm } from '../components/contacts/ContactForm';
import { ProfileCompletenessBadge } from '../components/contacts/ProfileCompleteness';
import { calculateProfileCompleteness } from '../utils/profileCompleteness';
import { openWhatsApp, openEmail, openPhoneCall } from '../utils/communication';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { getDaysUntil, formatRelative } from '../utils/dates';
import { useToast } from '../components/ui/Toast';
import type { Contact } from '../types';

type FilterType = 'all' | 'birthdays' | 'anniversaries' | 'recent' | 'today' | 'week' | 'month' | 'incomplete';

// Helper to check if date is within a time range
const isWithinDays = (dateStr: string | undefined, days: number) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= days;
};

const isToday = (dateStr: string | undefined) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  return date.toDateString() === now.toDateString();
};

export function Contacts() {
  const { contacts, isLoading, isLoadingMore, pagination, fetchContacts, loadMore, searchQuery, setSearchQuery, selectedTags, setSelectedTags, deleteContact, restoreContact, bulkAddTags } = useContactStore();
  const { addToast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchParams, setSearchParams] = useSearchParams();
  const [newTagInput, setNewTagInput] = useState('');
  const [tagsToAssign, setTagsToAssign] = useState<string[]>([]);

  // Handle query params
  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setShowAddModal(true);
      setSearchParams({});
    }
    const filter = searchParams.get('filter') as FilterType;
    if (['birthdays', 'anniversaries', 'recent', 'today', 'week', 'month', 'incomplete'].includes(filter)) {
      setActiveFilter(filter);
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Infinite scroll
  const { loadMoreRef } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore: pagination.hasMore,
    isLoading: isLoadingMore,
  });

  // Bulk selection handlers
  const toggleSelectContact = (id: string) => {
    setSelectedContacts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedContacts(new Set(filteredContacts.map(c => c.id)));
  };

  const clearSelection = () => {
    setSelectedContacts(new Set());
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedContacts.size} contacts?`)) return;

    const deletedContacts: Contact[] = [];
    for (const id of selectedContacts) {
      const deleted = await deleteContact(id);
      if (deleted) deletedContacts.push(deleted);
    }
    clearSelection();

    // Show undo toast
    if (deletedContacts.length > 0) {
      addToast({
        type: 'success',
        title: `${deletedContacts.length} contact${deletedContacts.length > 1 ? 's' : ''} deleted`,
        message: 'Click undo to restore',
        action: {
          label: 'Undo',
          onClick: async () => {
            for (const contact of deletedContacts) {
              await restoreContact(contact);
            }
            addToast({
              type: 'success',
              title: 'Contacts restored',
              message: `${deletedContacts.length} contact${deletedContacts.length > 1 ? 's' : ''} restored successfully`,
            });
          },
        },
      });
    }
  };

  const handleOpenTagModal = () => {
    setTagsToAssign([]);
    setNewTagInput('');
    setShowTagModal(true);
  };

  const handleAddTagToList = () => {
    const trimmed = newTagInput.trim().toLowerCase();
    if (trimmed && !tagsToAssign.includes(trimmed)) {
      setTagsToAssign([...tagsToAssign, trimmed]);
      setNewTagInput('');
    }
  };

  const handleRemoveTagFromList = (tag: string) => {
    setTagsToAssign(tagsToAssign.filter((t) => t !== tag));
  };

  const handleBulkTagAssign = async () => {
    if (tagsToAssign.length === 0) return;

    await bulkAddTags([...selectedContacts], tagsToAssign);
    addToast({
      type: 'success',
      title: 'Tags assigned',
      message: `Added ${tagsToAssign.length} tag${tagsToAssign.length > 1 ? 's' : ''} to ${selectedContacts.size} contact${selectedContacts.size > 1 ? 's' : ''}`,
    });
    setShowTagModal(false);
    clearSelection();
  };

  const allTags = [...new Set(contacts.flatMap((c) => c.tags))];

  // Helper to check if date is upcoming (within next 30 days)
  const isUpcoming = (dateStr: string | undefined) => {
    if (!dateStr) return false;
    const days = getDaysUntil(dateStr);
    return days >= 0 && days <= 30;
  };

  const filteredContacts = contacts
    .filter((contact) => {
      const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.emails.some((e) => e.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTags = selectedTags.length === 0 || selectedTags.some((tag) => contact.tags.includes(tag));

      // Apply special filters
      if (activeFilter === 'birthdays') {
        return matchesSearch && matchesTags && isUpcoming(contact.birthday);
      }
      if (activeFilter === 'anniversaries') {
        return matchesSearch && matchesTags && isUpcoming(contact.anniversary);
      }
      if (activeFilter === 'today') {
        return matchesSearch && matchesTags && isToday(contact.updatedAt);
      }
      if (activeFilter === 'week') {
        return matchesSearch && matchesTags && isWithinDays(contact.updatedAt, 7);
      }
      if (activeFilter === 'month') {
        return matchesSearch && matchesTags && isWithinDays(contact.updatedAt, 30);
      }
      if (activeFilter === 'recent') {
        return matchesSearch && matchesTags && isWithinDays(contact.updatedAt, 7);
      }
      if (activeFilter === 'incomplete') {
        const { percentage } = calculateProfileCompleteness(contact);
        return matchesSearch && matchesTags && percentage < 80;
      }

      return matchesSearch && matchesTags;
    })
    .sort((a, b) => {
      // Sort by upcoming date when filter is active
      if (activeFilter === 'birthdays' && a.birthday && b.birthday) {
        return getDaysUntil(a.birthday) - getDaysUntil(b.birthday);
      }
      if (activeFilter === 'anniversaries' && a.anniversary && b.anniversary) {
        return getDaysUntil(a.anniversary) - getDaysUntil(b.anniversary);
      }
      // Sort by most recently updated for time-based filters
      if (['recent', 'today', 'week', 'month'].includes(activeFilter)) {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      // Sort by completeness (lowest first) for incomplete filter
      if (activeFilter === 'incomplete') {
        const aComplete = calculateProfileCompleteness(a).percentage;
        const bComplete = calculateProfileCompleteness(b).percentage;
        return aComplete - bComplete;
      }
      return 0;
    });

  const toggleTag = (tag: string) => {
    setSelectedTags(selectedTags.includes(tag) ? selectedTags.filter((t) => t !== tag) : [...selectedTags, tag]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Contacts</h1>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Contact
        </Button>
      </div>

      {/* Bulk Selection Bar */}
      {selectedContacts.size > 0 && (
        <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/20 animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">
              {selectedContacts.size} selected
            </span>
            <Button size="sm" variant="ghost" onClick={selectAll}>
              Select all ({filteredContacts.length})
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleOpenTagModal}>
              <Tags className="h-4 w-4 mr-1" /> Add Tags
            </Button>
            <Button size="sm" variant="outline" onClick={handleBulkDelete} className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
            <Button size="sm" variant="ghost" onClick={clearSelection}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <Input
            placeholder="Search contacts..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={activeFilter === 'all' ? 'primary' : 'outline'}
            onClick={() => { setActiveFilter('all'); setSearchParams({}); }}
          >
            <Users className="h-4 w-4 mr-1" /> All
          </Button>
          <Button
            size="sm"
            variant={activeFilter === 'birthdays' ? 'primary' : 'outline'}
            onClick={() => { setActiveFilter('birthdays'); setSearchParams({ filter: 'birthdays' }); }}
          >
            <Gift className="h-4 w-4 mr-1" /> Upcoming Birthdays
          </Button>
          <Button
            size="sm"
            variant={activeFilter === 'anniversaries' ? 'primary' : 'outline'}
            onClick={() => { setActiveFilter('anniversaries'); setSearchParams({ filter: 'anniversaries' }); }}
          >
            <Calendar className="h-4 w-4 mr-1" /> Upcoming Anniversaries
          </Button>
          <span className="hidden sm:block w-px h-6 bg-[hsl(var(--border))] self-center mx-1" />
          <Button
            size="sm"
            variant={activeFilter === 'today' ? 'primary' : 'outline'}
            onClick={() => { setActiveFilter('today'); setSearchParams({ filter: 'today' }); }}
          >
            <Clock className="h-4 w-4 mr-1" /> Today
          </Button>
          <Button
            size="sm"
            variant={activeFilter === 'week' ? 'primary' : 'outline'}
            onClick={() => { setActiveFilter('week'); setSearchParams({ filter: 'week' }); }}
          >
            <History className="h-4 w-4 mr-1" /> This Week
          </Button>
          <Button
            size="sm"
            variant={activeFilter === 'month' ? 'primary' : 'outline'}
            onClick={() => { setActiveFilter('month'); setSearchParams({ filter: 'month' }); }}
          >
            <History className="h-4 w-4 mr-1" /> This Month
          </Button>
          <span className="hidden sm:block w-px h-6 bg-[hsl(var(--border))] self-center mx-1" />
          <Button
            size="sm"
            variant={activeFilter === 'incomplete' ? 'primary' : 'outline'}
            onClick={() => { setActiveFilter('incomplete'); setSearchParams({ filter: 'incomplete' }); }}
          >
            <AlertCircle className="h-4 w-4 mr-1" /> Incomplete Profiles
          </Button>
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Contacts Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonContactCard key={i} />
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="w-20 h-20 rounded-full bg-[hsl(var(--primary))]/10 flex items-center justify-center mb-4">
              <Users className="h-10 w-10 text-[hsl(var(--primary))]" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Welcome to Nu-Connect!</h3>
            <p className="text-[hsl(var(--muted-foreground))] mb-6">
              Start building your network by adding your first contact or importing your existing contacts.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button onClick={() => setShowAddModal(true)} className="gap-2">
                <UserPlus className="h-4 w-4" /> Add Contact
              </Button>
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" /> Import Contacts
              </Button>
            </div>
          </div>
        </Card>
      ) : filteredContacts.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Search className="h-12 w-12 text-[hsl(var(--muted-foreground))] mb-3" />
            <p className="text-[hsl(var(--muted-foreground))]">No contacts match your search</p>
            <Button variant="ghost" className="mt-4" onClick={() => { setSearchQuery(''); setSelectedTags([]); }}>
              Clear filters
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredContacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                isSelected={selectedContacts.has(contact.id)}
                onToggleSelect={() => toggleSelectContact(contact.id)}
                selectionMode={selectedContacts.size > 0}
                activeFilter={activeFilter}
              />
            ))}
          </div>

          {/* Infinite scroll trigger */}
          {pagination.hasMore && !searchQuery && selectedTags.length === 0 && (
            <div ref={loadMoreRef} className="flex justify-center py-8">
              {isLoadingMore && (
                <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading more contacts...</span>
                </div>
              )}
            </div>
          )}

          {/* Contact count */}
          <div className="text-center text-sm text-[hsl(var(--muted-foreground))] py-4">
            Showing {filteredContacts.length} of {pagination.totalCount} contacts
          </div>
        </>
      )}

      {/* Add Contact Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Contact" size="lg">
        <ContactForm onSuccess={() => setShowAddModal(false)} />
      </Modal>

      {/* Bulk Tag Assignment Modal */}
      <Modal isOpen={showTagModal} onClose={() => setShowTagModal(false)} title={`Add Tags to ${selectedContacts.size} Contact${selectedContacts.size > 1 ? 's' : ''}`}>
        <div className="space-y-4">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Add one or more tags to the selected contacts. Existing tags will be preserved.
          </p>

          {/* Tag input */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter tag name..."
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTagToList();
                }
              }}
            />
            <Button onClick={handleAddTagToList} disabled={!newTagInput.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Existing tags quick-add */}
          {allTags.length > 0 && (
            <div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">Quick add from existing tags:</p>
              <div className="flex flex-wrap gap-1">
                {allTags.filter((t) => !tagsToAssign.includes(t)).slice(0, 10).map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="cursor-pointer hover:bg-[hsl(var(--accent))]"
                    onClick={() => setTagsToAssign([...tagsToAssign, tag])}
                  >
                    + {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Tags to assign */}
          {tagsToAssign.length > 0 && (
            <div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">Tags to add:</p>
              <div className="flex flex-wrap gap-1">
                {tagsToAssign.map((tag) => (
                  <Badge key={tag} variant="default" className="gap-1">
                    {tag}
                    <button
                      onClick={() => handleRemoveTagFromList(tag)}
                      className="ml-1 hover:text-red-300"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-[hsl(var(--border))]">
            <Button variant="outline" onClick={() => setShowTagModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkTagAssign} disabled={tagsToAssign.length === 0}>
              <Tags className="h-4 w-4 mr-2" />
              Add {tagsToAssign.length} Tag{tagsToAssign.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ContactCard({
  contact,
  isSelected,
  onToggleSelect,
  selectionMode,
  activeFilter
}: {
  contact: Contact;
  isSelected: boolean;
  onToggleSelect: () => void;
  selectionMode: boolean;
  activeFilter: FilterType;
}) {
  const showBirthdayBadge = activeFilter === 'birthdays' && contact.birthday;
  const showAnniversaryBadge = activeFilter === 'anniversaries' && contact.anniversary;
  const showTimeBadge = ['today', 'week', 'month', 'recent'].includes(activeFilter);
  const showIncompleteBadge = activeFilter === 'incomplete';
  const daysUntil = showBirthdayBadge
    ? getDaysUntil(contact.birthday!)
    : showAnniversaryBadge
      ? getDaysUntil(contact.anniversary!)
      : null;

  return (
    <Card className={`overflow-hidden transition-all hover:shadow-lg ${isSelected ? 'ring-2 ring-[hsl(var(--primary))]' : ''}`}>
      <div className="relative">
        {/* Selection checkbox */}
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleSelect();
          }}
          className={`absolute top-3 left-3 z-10 p-1 rounded-md transition-all ${
            selectionMode || isSelected
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100'
          } ${isSelected ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}
        >
          {isSelected ? (
            <CheckSquare className="h-5 w-5" />
          ) : (
            <Square className="h-5 w-5" />
          )}
        </button>

        {/* Days until badge */}
        {daysUntil !== null && (
          <div className="absolute top-3 right-3 z-10">
            <Badge variant={daysUntil <= 7 ? 'default' : 'secondary'} className="flex items-center gap-1">
              {showBirthdayBadge ? <Gift className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
              {daysUntil === 0 ? 'Today!' : `${daysUntil}d`}
            </Badge>
          </div>
        )}

        {/* Updated time badge */}
        {showTimeBadge && (
          <div className="absolute top-3 right-3 z-10">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatRelative(contact.updatedAt)}
            </Badge>
          </div>
        )}

        {/* Profile completeness badge */}
        {showIncompleteBadge && (
          <div className="absolute top-3 right-3 z-10">
            <ProfileCompletenessBadge contact={contact} />
          </div>
        )}

        <Link to={`/contacts/${contact.id}`} className="block p-4 group">
          <div className="flex items-start gap-4">
            <Avatar src={contact.profilePicture} name={contact.name} size="lg" />
            <div className="flex-1 overflow-hidden">
              <h3 className="truncate font-semibold">{contact.name}</h3>
              {contact.company && (
                <p className="truncate text-sm text-[hsl(var(--muted-foreground))]">{contact.company}</p>
              )}
              {/* Show date info when filtered */}
              {showBirthdayBadge && (
                <p className="text-sm text-pink-600 dark:text-pink-400 mt-1">
                  🎂 {new Date(contact.birthday!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              )}
              {showAnniversaryBadge && (
                <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                  💍 {new Date(contact.anniversary!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              )}
              {showTimeBadge && (
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  Updated {formatRelative(contact.updatedAt)}
                </p>
              )}
              {showIncompleteBadge && (
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                  Missing: {calculateProfileCompleteness(contact).missingFields.slice(0, 3).join(', ')}
                </p>
              )}
              {contact.tags.length > 0 && !showBirthdayBadge && !showAnniversaryBadge && !showTimeBadge && !showIncompleteBadge && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {contact.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Link>
      </div>
      <div className="flex border-t border-[hsl(var(--border))]">
        <button
          onClick={() => openPhoneCall(contact)}
          disabled={!contact.phones.length}
          className="flex flex-1 items-center justify-center gap-1 py-3 text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] disabled:opacity-50"
        >
          <Phone className="h-4 w-4" />
        </button>
        <button
          onClick={() => openEmail(contact)}
          disabled={!contact.emails.length}
          className="flex flex-1 items-center justify-center gap-1 border-x border-[hsl(var(--border))] py-3 text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] disabled:opacity-50"
        >
          <Mail className="h-4 w-4" />
        </button>
        <button
          onClick={() => openWhatsApp(contact)}
          disabled={!contact.whatsappNumber && !contact.phones.length}
          className="flex flex-1 items-center justify-center gap-1 py-3 text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-green-500 disabled:opacity-50"
        >
          <MessageCircle className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
}
