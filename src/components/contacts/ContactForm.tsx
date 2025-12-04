import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useMemo } from 'react';
import { AlertTriangle, Link as LinkIcon } from 'lucide-react';
import { Button, Input, Textarea, Avatar } from '../ui';
import { useContactStore } from '../../store/contactStore';
import type { Contact } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { Link } from 'react-router-dom';

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  emails: z.string().optional(),
  phones: z.string().optional(),
  whatsappNumber: z.string().optional(),
  instagramHandle: z.string().optional(),
  company: z.string().optional(),
  tags: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  birthday: z.string().optional(),
  anniversary: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactFormProps {
  contact?: Contact;
  onSuccess: () => void;
}

// Helper to check for potential duplicates
function findDuplicates(contacts: Contact[], name: string, email: string, phone: string, excludeId?: string): Contact[] {
  if (!name && !email && !phone) return [];

  const nameLower = name.toLowerCase().trim();
  const emailLower = email.toLowerCase().trim();
  const phoneCleaned = phone.replace(/\D/g, '');

  return contacts.filter((c) => {
    if (excludeId && c.id === excludeId) return false;

    // Check name similarity (fuzzy match)
    const nameMatch = nameLower && c.name.toLowerCase().includes(nameLower);

    // Check email match
    const emailMatch = emailLower && c.emails.some((e) => e.toLowerCase() === emailLower);

    // Check phone match (normalized)
    const phoneMatch = phoneCleaned && c.phones.some((p) => p.replace(/\D/g, '').includes(phoneCleaned));

    return nameMatch || emailMatch || phoneMatch;
  }).slice(0, 3); // Limit to 3 suggestions
}

export function ContactForm({ contact, onSuccess }: ContactFormProps) {
  const { contacts, createContact, updateContact, isLoading } = useContactStore();
  const { user } = useAuthStore();
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: contact ? {
      name: contact.name,
      emails: contact.emails.join(', '),
      phones: contact.phones.join(', '),
      whatsappNumber: contact.whatsappNumber || '',
      instagramHandle: contact.instagramHandle || '',
      company: contact.company || '',
      tags: contact.tags.join(', '),
      address: contact.address || '',
      notes: contact.notes || '',
      birthday: contact.birthday || '',
      anniversary: contact.anniversary || '',
    } : {},
  });

  // Watch for changes to detect duplicates
  const watchName = useWatch({ control, name: 'name' }) || '';
  const watchEmails = useWatch({ control, name: 'emails' }) || '';
  const watchPhones = useWatch({ control, name: 'phones' }) || '';

  // Find potential duplicates and determine if warning should show
  const potentialDuplicates = useMemo(() => {
    const firstEmail = watchEmails.split(',')[0]?.trim() || '';
    const firstPhone = watchPhones.split(',')[0]?.trim() || '';
    return findDuplicates(contacts, watchName, firstEmail, firstPhone, contact?.id);
  }, [contacts, watchName, watchEmails, watchPhones, contact?.id]);

  // Determine if we should show the duplicate warning
  // Show when duplicates exist for new contacts and user hasn't dismissed it
  const shouldShowWarning = potentialDuplicates.length > 0 && !contact && showDuplicateWarning;

  const onSubmit = async (data: ContactFormData) => {
    const contactData = {
      userId: user!.id,
      name: data.name,
      emails: data.emails ? data.emails.split(',').map((e) => e.trim()).filter(Boolean) : [],
      phones: data.phones ? data.phones.split(',').map((p) => p.trim()).filter(Boolean) : [],
      whatsappNumber: data.whatsappNumber || undefined,
      instagramHandle: data.instagramHandle || undefined,
      company: data.company || undefined,
      tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      address: data.address || undefined,
      notes: data.notes || undefined,
      birthday: data.birthday || undefined,
      anniversary: data.anniversary || undefined,
    };

    if (contact) {
      await updateContact(contact.id, contactData);
    } else {
      await createContact(contactData);
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Name *" {...register('name')} error={errors.name?.message} />
      <Input label="Emails (comma separated)" {...register('emails')} placeholder="john@example.com, john.doe@work.com" />
      <Input label="Phone Numbers (comma separated)" {...register('phones')} placeholder="+1234567890, +0987654321" />

      {/* Duplicate Warning */}
      {shouldShowWarning && (
        <div className="rounded-lg border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Possible duplicate{potentialDuplicates.length > 1 ? 's' : ''} found
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                These existing contacts look similar:
              </p>
              <div className="mt-3 space-y-2">
                {potentialDuplicates.map((dup) => (
                  <Link
                    key={dup.id}
                    to={`/contacts/${dup.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg bg-yellow-100 dark:bg-yellow-800/30 hover:bg-yellow-200 dark:hover:bg-yellow-800/50 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                    target="_blank"
                  >
                    <Avatar src={dup.profilePicture} name={dup.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate text-yellow-900 dark:text-yellow-100">{dup.name}</p>
                      {dup.emails[0] && (
                        <p className="text-xs text-yellow-700 dark:text-yellow-300 truncate">{dup.emails[0]}</p>
                      )}
                    </div>
                    <LinkIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  </Link>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowDuplicateWarning(false)}
                className="mt-3 text-sm text-yellow-700 dark:text-yellow-300 hover:underline"
              >
                Dismiss and continue
              </button>
            </div>
          </div>
        </div>
      )}

      <Input label="WhatsApp Number" {...register('whatsappNumber')} placeholder="+1234567890" />
      <Input label="Instagram Handle" {...register('instagramHandle')} placeholder="@username" />
      <Input label="Company" {...register('company')} />
      <Input label="Tags (comma separated)" {...register('tags')} placeholder="friend, work, vip" />
      <Input label="Address" {...register('address')} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Birthday" type="date" {...register('birthday')} />
        <Input label="Anniversary" type="date" {...register('anniversary')} />
      </div>
      <Textarea label="Notes" {...register('notes')} rows={3} />
      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" isLoading={isLoading}>
          {contact ? 'Update Contact' : 'Add Contact'}
        </Button>
      </div>
    </form>
  );
}
