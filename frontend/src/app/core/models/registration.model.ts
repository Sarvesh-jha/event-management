export interface StudentRegistration {
  id: string;
  registrationId: string;
  eventId: string;
  eventTitle?: string;
  attendeeName: string;
  attendeeEmail: string;
  qrCodeToken: string;
  qrCodeDataUrl?: string;
  status: 'confirmed' | 'waitlisted' | 'cancelled';
  note?: string;
  checkedIn: boolean;
  checkedInAt?: string | null;
  certificateIssuedAt?: string | null;
  certificateNumber?: string;
  createdAt?: string;
  updatedAt?: string;
  message?: string;
}
