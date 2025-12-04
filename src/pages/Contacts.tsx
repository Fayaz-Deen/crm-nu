import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, Phone, Mail, MessageCircle, Users, Upload, UserPlus, Trash2, Tag, MoreHorizontal, CheckSquare, Square, X } from 'lucide-react';
import { Button, Input, Card, Avatar, Badge, Modal, SkeletonContactCard } from '../components/ui';
import { useContactStore } from '../store/contactStore';
import { ContactForm } from '../components/contacts/ContactForm';
import { openWhatsApp, openEmail, openPhoneCall } from '../utils/communication';
import type { Contact } from '../types';

export function Contacts() {
  const { contacts, isLoading, fetchContacts, searchQuery, setSearchQuery, selectedTags, setSelectedTags, deleteContact } = useContactStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [searchParams, setSearchParams] = useSearchParams();

  // Handle action query param
  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setShowAddModal(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

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
    if (!confirm(`Delete ${selectedContacts.size} contacts? This cannot be undone.`)) return;
    for (const id of selectedContacts) {
      await deleteContact(id);
    }
    clearSelection();
  };

  const allTags = [...new Set(contacts.flatMap((c) => c.tags))];

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.emails.some((e) => e.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTags = selectedTags.length === 0 || selectedTags.some((tag) => contact.tags.includes(tag));
    return matchesSearch && matchesTags;
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredContacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              isSelected={selectedContacts.has(contact.id)}
              onToggleSelect={() => toggleSelectContact(contact.id)}
              selectionMode={selectedContacts.size > 0}
            />
          ))}
        </div>
      )}

      {/* Add Contact Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Contact" size="lg">
        <ContactForm onSuccess={() => setShowAddModal(false)} />
      </Modal>
    </div>
  );
}

function ContactCard({
  contact,
  isSelected,
  onToggleSelect,
  selectionMode
}: {
  contact: Contact;
  isSelected: boolean;
  onToggleSelect: () => void;
  selectionMode: boolean;
}) {
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

        <Link to={`/contacts/${contact.id}`} className="block p-4 group">
          <div className="flex items-start gap-4">
            <Avatar src={contact.profilePicture} name={contact.name} size="lg" />
            <div className="flex-1 overflow-hidden">
              <h3 className="truncate font-semibold">{contact.name}</h3>
              {contact.company && (
                <p className="truncate text-sm text-[hsl(var(--muted-foreground))]">{contact.company}</p>
              )}
              {contact.tags.length > 0 && (
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
