import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Phone, Mail, MessageCircle, Instagram, MapPin, Gift, Heart, Plus, Share2 } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Avatar, Badge, Modal } from '../components/ui';
import { useContactStore } from '../store/contactStore';
import { useMeetingStore } from '../store/meetingStore';
import { ContactForm } from '../components/contacts/ContactForm';
import { MeetingForm } from '../components/meetings/MeetingForm';
import { MeetingTimeline } from '../components/meetings/MeetingTimeline';
import ShareContactModal from '../components/contacts/ShareContactModal';
import { ProfileCompleteness } from '../components/contacts/ProfileCompleteness';
import { openWhatsApp, openEmail, openInstagram, openPhoneCall, getDefaultMessage } from '../utils/communication';
import { formatBirthday, formatRelative } from '../utils/dates';

export function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedContact, getContact, deleteContact, addToRecentlyViewed, isLoading } = useContactStore();
  const { meetings, fetchMeetings } = useMeetingStore();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    if (id) {
      getContact(id);
      fetchMeetings(id);
    }
  }, [id, getContact, fetchMeetings]);

  // Track recently viewed
  useEffect(() => {
    if (selectedContact) {
      addToRecentlyViewed(selectedContact);
    }
  }, [selectedContact, addToRecentlyViewed]);

  const handleDelete = async () => {
    if (id) {
      await deleteContact(id);
      navigate('/contacts');
    }
  };

  if (isLoading || !selectedContact) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[hsl(var(--primary))] border-t-transparent" />
      </div>
    );
  }

  const contact = selectedContact;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/contacts')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Contact Details</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contact Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Avatar src={contact.profilePicture} name={contact.name} size="xl" className="mx-auto" />
                <h2 className="mt-4 text-xl font-bold">{contact.name}</h2>
                {contact.company && (
                  <p className="text-[hsl(var(--muted-foreground))]">{contact.company}</p>
                )}
                {contact.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap justify-center gap-1">
                    {contact.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="mt-6 grid grid-cols-4 gap-2">
                <button onClick={() => openPhoneCall(contact)} disabled={!contact.phones.length} className="flex flex-col items-center gap-1 rounded-lg p-3 hover:bg-[hsl(var(--accent))] disabled:opacity-50">
                  <Phone className="h-5 w-5 text-blue-500" />
                  <span className="text-xs">Call</span>
                </button>
                <button onClick={() => openEmail(contact)} disabled={!contact.emails.length} className="flex flex-col items-center gap-1 rounded-lg p-3 hover:bg-[hsl(var(--accent))] disabled:opacity-50">
                  <Mail className="h-5 w-5 text-red-500" />
                  <span className="text-xs">Email</span>
                </button>
                <button onClick={() => openWhatsApp(contact)} disabled={!contact.whatsappNumber && !contact.phones.length} className="flex flex-col items-center gap-1 rounded-lg p-3 hover:bg-[hsl(var(--accent))] disabled:opacity-50">
                  <MessageCircle className="h-5 w-5 text-green-500" />
                  <span className="text-xs">WhatsApp</span>
                </button>
                <button onClick={() => openInstagram(contact)} disabled={!contact.instagramHandle} className="flex flex-col items-center gap-1 rounded-lg p-3 hover:bg-[hsl(var(--accent))] disabled:opacity-50">
                  <Instagram className="h-5 w-5 text-pink-500" />
                  <span className="text-xs">Instagram</span>
                </button>
              </div>

              {/* Contact Details */}
              <div className="mt-6 space-y-3 border-t border-[hsl(var(--border))] pt-6">
                {contact.emails.map((email) => (
                  <div key={email} className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                    <span className="text-sm">{email}</span>
                  </div>
                ))}
                {contact.phones.map((phone) => (
                  <div key={phone} className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                    <span className="text-sm">{phone}</span>
                  </div>
                ))}
                {contact.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                    <span className="text-sm">{contact.address}</span>
                  </div>
                )}
                {contact.birthday && (
                  <div className="flex items-center gap-3">
                    <Gift className="h-4 w-4 text-pink-500" />
                    <span className="text-sm">{formatBirthday(contact.birthday)}</span>
                  </div>
                )}
                {contact.anniversary && (
                  <div className="flex items-center gap-3">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="text-sm">{formatBirthday(contact.anniversary)}</span>
                  </div>
                )}
              </div>

              {contact.notes && (
                <div className="mt-4 border-t border-[hsl(var(--border))] pt-4">
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{contact.notes}</p>
                </div>
              )}

              {/* Profile Completeness */}
              <div className="mt-4 border-t border-[hsl(var(--border))] pt-4">
                <ProfileCompleteness contact={contact} />
              </div>

              {/* Edit/Delete/Share */}
              <div className="mt-6 flex gap-2 border-t border-[hsl(var(--border))] pt-6">
                <Button variant="outline" className="flex-1" onClick={() => setShowEditModal(true)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
                <Button variant="outline" size="icon" onClick={() => setShowShareModal(true)}>
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="icon" onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Messages */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Messages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => openWhatsApp(contact, getDefaultMessage('followup', contact.name))}>
                Send Follow-up
              </Button>
              {contact.birthday && (
                <Button variant="outline" className="w-full justify-start" onClick={() => openWhatsApp(contact, getDefaultMessage('birthday', contact.name))}>
                  Send Birthday Wish
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Interaction Timeline</CardTitle>
              <Button onClick={() => setShowMeetingModal(true)}>
                <Plus className="mr-2 h-4 w-4" /> Log Meeting
              </Button>
            </CardHeader>
            <CardContent>
              {contact.lastContactedAt && (
                <p className="mb-4 text-sm text-[hsl(var(--muted-foreground))]">
                  Last contacted: {formatRelative(contact.lastContactedAt)}
                </p>
              )}
              <MeetingTimeline meetings={meetings} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Contact" size="lg">
        <ContactForm contact={contact} onSuccess={() => setShowEditModal(false)} />
      </Modal>

      <Modal isOpen={showMeetingModal} onClose={() => setShowMeetingModal(false)} title="Log Meeting" size="lg">
        <MeetingForm contactId={contact.id} onSuccess={() => setShowMeetingModal(false)} />
      </Modal>

      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Contact">
        <p className="mb-4">Are you sure you want to delete {contact.name}? This action cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>

      <ShareContactModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        contactId={contact.id}
        contactName={contact.name}
      />
    </div>
  );
}
