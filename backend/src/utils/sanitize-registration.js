const sanitizeRegistration = ({ registration, event, user, qrCodeDataUrl = '' }) => ({
  id: registration._id.toString(),
  registrationId: registration._id.toString(),
  eventId: event?._id ? event._id.toString() : event?.id ?? registration.event?.toString(),
  eventTitle: event?.title,
  attendeeName: user?.fullName,
  attendeeEmail: user?.email,
  qrCodeToken: registration.qrCodeToken,
  qrCodeDataUrl,
  status: registration.status,
  note: registration.note,
  checkedIn: registration.checkedIn,
  checkedInAt: registration.checkedInAt,
  certificateIssuedAt: registration.certificateIssuedAt,
  certificateNumber: registration.certificateNumber,
  createdAt: registration.createdAt,
  updatedAt: registration.updatedAt,
});

module.exports = sanitizeRegistration;
