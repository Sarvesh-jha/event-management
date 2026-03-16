export type EventMode = 'In Person' | 'Hybrid' | 'Virtual';

export interface EventAgendaItem {
  time: string;
  title: string;
  description: string;
}

export interface CampusEvent {
  id: string;
  title: string;
  shortDescription: string;
  description: string;
  category: string;
  department: string;
  startDate: string;
  endDate: string;
  venue: string;
  mode: EventMode;
  capacity: number;
  registeredCount: number;
  organizer: string;
  keynote?: string;
  tags: string[];
  coverGradient: string;
  agenda: EventAgendaItem[];
  status?: 'draft' | 'published' | 'completed';
}

export interface EventRegistrationPayload {
  note?: string;
}

export interface EventRegistrationReceipt {
  id?: string;
  registrationId: string;
  eventId: string;
  eventTitle?: string;
  attendeeName: string;
  attendeeEmail: string;
  qrCodeToken: string;
  qrCodeDataUrl?: string;
  status: 'confirmed' | 'waitlisted';
  checkedIn?: boolean;
  checkedInAt?: string | null;
  certificateIssuedAt?: string | null;
  certificateNumber?: string;
  message: string;
}

export interface EventFormPayload {
  title: string;
  shortDescription: string;
  description: string;
  category: string;
  department: string;
  startDate: string;
  endDate: string;
  venue: string;
  mode: EventMode;
  capacity: number;
  organizer: string;
  keynote?: string;
  tags: string[] | string;
  coverGradient?: string;
  agenda?: EventAgendaItem[];
  status?: 'draft' | 'published' | 'completed';
}
