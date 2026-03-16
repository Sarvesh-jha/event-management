const crypto = require('crypto');
const mongoose = require('mongoose');
const QRCode = require('qrcode');

const Event = require('../models/event.model');
const Registration = require('../models/registration.model');
const User = require('../models/user.model');
const createAppError = require('../utils/app-error');
const sanitizeRegistration = require('../utils/sanitize-registration');
const { sendRegistrationConfirmationEmail } = require('./email.service');
const {
  createCheckInNotification,
  createRegistrationConfirmationNotification,
} = require('./notification.service');
const { generateCertificateBuffer } = require('./certificate.service');

const ensureValidObjectId = (value, label) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw createAppError(`Invalid ${label}.`, 400);
  }
};

const buildQrCodeDataUrl = (qrCodeToken) =>
  QRCode.toDataURL(`SCE-CHECKIN:${qrCodeToken}`, {
    width: 280,
    margin: 1,
  });

const buildCertificateNumber = (registration) =>
  `SCE-${registration._id.toString().slice(-6).toUpperCase()}-${new Date().getFullYear()}`;

const registerForEvent = async ({ eventId, userId, note }) => {
  ensureValidObjectId(eventId, 'event id');

  const [event, user] = await Promise.all([
    Event.findById(eventId),
    User.findById(userId),
  ]);

  if (!event || event.status === 'draft') {
    throw createAppError('Event not found.', 404);
  }

  if (!user || !user.isActive) {
    throw createAppError('Authenticated user not found.', 404);
  }

  if (user.role !== 'student') {
    throw createAppError('Only students can register for events.', 403);
  }

  if (new Date(event.endDate) < new Date()) {
    throw createAppError('This event has already ended.', 400);
  }

  const existingRegistration = await Registration.findOne({
    event: event._id,
    user: user._id,
  });

  if (existingRegistration) {
    throw createAppError('You are already registered for this event.', 409);
  }

  const status = event.registeredCount < event.capacity ? 'confirmed' : 'waitlisted';
  const qrCodeToken = crypto.randomBytes(18).toString('hex');

  const registration = await Registration.create({
    event: event._id,
    user: user._id,
    note: note?.trim() || '',
    status,
    qrCodeToken,
  });

  if (status === 'confirmed') {
    event.registeredCount += 1;
    await event.save();
  }

  const qrCodeDataUrl = await buildQrCodeDataUrl(qrCodeToken);

  await createRegistrationConfirmationNotification({
    user,
    event,
    registration,
  });

  try {
    await sendRegistrationConfirmationEmail({ user, event, registration });
    registration.confirmationEmailSentAt = new Date();
    await registration.save();
  } catch (error) {
    console.error('Unable to send registration confirmation email:', error.message);
  }

  return {
    ...sanitizeRegistration({
      registration,
      event,
      user,
      qrCodeDataUrl,
    }),
    message:
      status === 'confirmed'
        ? 'Registration confirmed successfully.'
        : 'Event is full, so you have been added to the waitlist.',
  };
};

const getMyRegistrations = async (userId) => {
  const registrations = await Registration.find({ user: userId })
    .populate('event')
    .populate('user')
    .sort({ createdAt: -1 });

  const registrationItems = [];

  for (const registration of registrations) {
    const qrCodeDataUrl = await buildQrCodeDataUrl(registration.qrCodeToken);

    registrationItems.push(
      sanitizeRegistration({
        registration,
        event: registration.event,
        user: registration.user,
        qrCodeDataUrl,
      }),
    );
  }

  return registrationItems;
};

const getMyRegistrationForEvent = async ({ eventId, userId }) => {
  ensureValidObjectId(eventId, 'event id');

  const registration = await Registration.findOne({
    event: eventId,
    user: userId,
  })
    .populate('event')
    .populate('user');

  if (!registration) {
    return null;
  }

  const qrCodeDataUrl = await buildQrCodeDataUrl(registration.qrCodeToken);

  return sanitizeRegistration({
    registration,
    event: registration.event,
    user: registration.user,
    qrCodeDataUrl,
  });
};

const verifyCheckIn = async ({ qrCodeToken, adminUserId }) => {
  if (!qrCodeToken) {
    throw createAppError('qrCodeToken is required.', 400);
  }

  const [registration, adminUser] = await Promise.all([
    Registration.findOne({ qrCodeToken }).populate('event').populate('user'),
    User.findById(adminUserId),
  ]);

  if (!registration) {
    throw createAppError('Registration QR code was not found.', 404);
  }

  if (!adminUser || adminUser.role !== 'admin') {
    throw createAppError('Only admins can verify QR check-ins.', 403);
  }

  if (registration.checkedIn) {
    return {
      ...sanitizeRegistration({
        registration,
        event: registration.event,
        user: registration.user,
      }),
      message: 'Participant has already been checked in.',
    };
  }

  if (registration.status === 'waitlisted') {
    registration.status = 'confirmed';
    registration.event.registeredCount += 1;
    await registration.event.save();
  }

  registration.checkedIn = true;
  registration.checkedInAt = new Date();
  registration.checkedInBy = adminUser._id;
  await registration.save();

  await createCheckInNotification({
    user: registration.user,
    event: registration.event,
    registration,
  });

  return {
    ...sanitizeRegistration({
      registration,
      event: registration.event,
      user: registration.user,
    }),
    message: 'QR code verified and attendance recorded.',
  };
};

const generateCertificate = async ({ registrationId, userId }) => {
  ensureValidObjectId(registrationId, 'registration id');

  const registration = await Registration.findOne({
    _id: registrationId,
    user: userId,
  })
    .populate('event')
    .populate('user');

  if (!registration) {
    throw createAppError('Registration not found.', 404);
  }

  if (!registration.checkedIn) {
    throw createAppError('Certificate is available only after event check-in.', 400);
  }

  const eventHasCompleted =
    registration.event.status === 'completed' ||
    new Date(registration.event.endDate) <= new Date();

  if (!eventHasCompleted) {
    throw createAppError('Certificate will be available after the event is completed.', 400);
  }

  if (!registration.certificateIssuedAt) {
    registration.certificateIssuedAt = new Date();
    registration.certificateNumber = buildCertificateNumber(registration);
    await registration.save();
  }

  const buffer = await generateCertificateBuffer({
    registration,
    user: registration.user,
    event: registration.event,
  });

  return {
    filename: `${registration.event.title.replace(/\s+/g, '-').toLowerCase()}-certificate.pdf`,
    buffer,
  };
};

module.exports = {
  registerForEvent,
  getMyRegistrations,
  getMyRegistrationForEvent,
  verifyCheckIn,
  generateCertificate,
};
