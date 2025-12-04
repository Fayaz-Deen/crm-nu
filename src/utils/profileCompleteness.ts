import type { Contact } from '../types';

interface FieldWeight {
  field: keyof Contact | 'hasEmail' | 'hasPhone';
  label: string;
  weight: number;
  check: (contact: Contact) => boolean;
}

const PROFILE_FIELDS: FieldWeight[] = [
  { field: 'name', label: 'Name', weight: 15, check: (c) => !!c.name?.trim() },
  { field: 'hasEmail', label: 'Email', weight: 15, check: (c) => c.emails.length > 0 },
  { field: 'hasPhone', label: 'Phone', weight: 15, check: (c) => c.phones.length > 0 },
  { field: 'company', label: 'Company', weight: 10, check: (c) => !!c.company?.trim() },
  { field: 'address', label: 'Address', weight: 10, check: (c) => !!c.address?.trim() },
  { field: 'birthday', label: 'Birthday', weight: 10, check: (c) => !!c.birthday },
  { field: 'anniversary', label: 'Anniversary', weight: 5, check: (c) => !!c.anniversary },
  { field: 'whatsappNumber', label: 'WhatsApp', weight: 5, check: (c) => !!c.whatsappNumber?.trim() },
  { field: 'instagramHandle', label: 'Instagram', weight: 5, check: (c) => !!c.instagramHandle?.trim() },
  { field: 'notes', label: 'Notes', weight: 5, check: (c) => !!c.notes?.trim() },
  { field: 'profilePicture', label: 'Photo', weight: 5, check: (c) => !!c.profilePicture },
];

export function calculateProfileCompleteness(contact: Contact): {
  percentage: number;
  filledFields: string[];
  missingFields: string[];
} {
  let totalWeight = 0;
  let earnedWeight = 0;
  const filledFields: string[] = [];
  const missingFields: string[] = [];

  for (const field of PROFILE_FIELDS) {
    totalWeight += field.weight;
    if (field.check(contact)) {
      earnedWeight += field.weight;
      filledFields.push(field.label);
    } else {
      missingFields.push(field.label);
    }
  }

  return {
    percentage: Math.round((earnedWeight / totalWeight) * 100),
    filledFields,
    missingFields,
  };
}
