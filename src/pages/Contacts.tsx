import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Phone, Mail, MessageCircle, Users, Upload, UserPlus } from 'lucide-react';
import { Button, Input, Card, Avatar, Badge, Modal, SkeletonContactCard } from '../components/ui';
import { useContactStore } from '../store/contactStore';
import { ContactForm } from '../components/contacts/ContactForm';
import { openWhatsApp, openEmail, openPhoneCall } from '../utils/communication';
import type { Contact } from '../types';

export function Contacts() {
  const { contacts, isLoading, fetchContacts, searchQuery, setSearchQuery, selectedTags, setSelectedTags } = useContactStore();
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

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
            <ContactCard key={contact.id} contact={contact} />
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

function ContactCard({ contact }: { contact: Contact }) {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <Link to={`/contacts/${contact.id}`} className="block p-4">
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
