const crypto = require('crypto');
const mongoose = require('mongoose');
const QRCode = require('qrcode');

const Event = require('../models/event.model');
const Registration = require('../models/registration.model');
const User = require('../models/user.model');
const { isUsingLocalDatabase } = require('../config/database');
const localStore = require('../data/local-store');
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

const loadLocalRegistrationRelations = async (registration) => {
  const [event, user] = await Promise.all([
    localStore.findEventById(registration.event),
    localStore.findUserById(registration.user),
  ]);

  return {
    event,
    user,
  };
};

const registerForEvent = async ({ eventId, userId, note }) => {
  ensureValidObjectId(eventId, 'event id');

  if (isUsingLocalDatabase()) {
    const [event, user] = await Promise.all([
      localStore.findEventById(eventId),
      localStore.findUserById(userId),
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

    const existingRegistration = await localStore.findRegistrationByEventAndUser({
      eventId: event._id,
      userId: user._id,
    });

    if (existingRegistration) {
      throw createAppError('You are already registered for this event.', 409);
    }

    const status = event.registeredCount < event.capacity ? 'confirmed' : 'waitlisted';
    const qrCodeToken = crypto.randomBytes(18).toString('hex');

    let registration = await localStore.createRegistration({
      event: event._id,
      user: user._id,
      note: note?.trim() || '',
      status,
      qrCodeToken,
    });

    let nextEvent = event;
    if (status === 'confirmed') {
      nextEvent = await localStore.updateEvent(event._id, {
        registeredCount: event.registeredCount + 1,
      });
    }

    const qrCodeDataUrl = await buildQrCodeDataUrl(qrCodeToken);

    await createRegistrationConfirmationNotification({
      user,
      event: nextEvent,
      registration,
    });

    try {
      await sendRegistrationConfirmationEmail({
        user,
        event: nextEvent,
        registration,
      });
      registration = await localStore.updateRegistration(registration._id, {
        confirmationEmailSentAt: new Date(),
      });
    } catch (error) {
      console.error(
        'Unable to send registration confirmation email:',
        error.message,
      );
    }

    return {
      ...sanitizeRegistration({
        registration,
        event: nextEvent,
        user,
        qrCodeDataUrl,
      }),
      message:
        status === 'confirmed'
          ? 'Registration confirmed successfully.'
          : 'Event is full, so you have been added to the waitlist.',
    };
  }

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
  if (isUsingLocalDatabase()) {
    const registrations = (await localStore.listRegistrations())
      .filter((registration) => registration.user === userId)
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      );

    const registrationItems = [];

    for (const registration of registrations) {
      const [{ event, user }, qrCodeDataUrl] = await Promise.all([
        loadLocalRegistrationRelations(registration),
        buildQrCodeDataUrl(registration.qrCodeToken),
      ]);

      registrationItems.push(
        sanitizeRegistration({
          registration,
          event,
          user,
          qrCodeDataUrl,
        }),
      );
    }

    return registrationItems;
  }

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

  if (isUsingLocalDatabase()) {
    const registration = await localStore.findRegistrationByEventAndUser({
      eventId,
      userId,
    });

    if (!registration) {
      return null;
    }

    const [{ event, user }, qrCodeDataUrl] = await Promise.all([
      loadLocalRegistrationRelations(registration),
      buildQrCodeDataUrl(registration.qrCodeToken),
    ]);

    return sanitizeRegistration({
      registration,
      event,
      user,
      qrCodeDataUrl,
    });
  }

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

  if (isUsingLocalDatabase()) {
    const [registration, adminUser] = await Promise.all([
      localStore.findRegistrationByQrCodeToken(qrCodeToken),
      localStore.findUserById(adminUserId),
    ]);

    if (!registration) {
      throw createAppError('Registration QR code was not found.', 404);
    }

    if (!adminUser || adminUser.role !== 'admin') {
      throw createAppError('Only admins can verify QR check-ins.', 403);
    }

    const { event, user } = await loadLocalRegistrationRelations(registration);

    if (registration.checkedIn) {
      return {
        ...sanitizeRegistration({
          registration,
          event,
          user,
        }),
        message: 'Participant has already been checked in.',
      };
    }

    let nextEvent = event;
    let nextRegistration = registration;

    if (registration.status === 'waitlisted') {
      nextEvent = await localStore.updateEvent(event._id, {
        registeredCount: event.registeredCount + 1,
      });
      nextRegistration = await localStore.updateRegistration(registration._id, {
        status: 'confirmed',
      });
    }

    nextRegistration = await localStore.updateRegistration(nextRegistration._id, {
      checkedIn: true,
      checkedInAt: new Date(),
      checkedInBy: adminUser._id,
    });

    await createCheckInNotification({
      user,
      event: nextEvent,
      registration: nextRegistration,
    });

    return {
      ...sanitizeRegistration({
        registration: nextRegistration,
        event: nextEvent,
        user,
      }),
      message: 'QR code verified and attendance recorded.',
    };
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

  if (isUsingLocalDatabase()) {
    let registration = await localStore.findRegistrationById(registrationId);

    if (!registration || registration.user !== userId) {
      throw createAppError('Registration not found.', 404);
    }

    const { event, user } = await loadLocalRegistrationRelations(registration);

    if (!registration.checkedIn) {
      throw createAppError(
        'Certificate is available only after event check-in.',
        400,
      );
    }

    const eventHasCompleted =
      event.status === 'completed' || new Date(event.endDate) <= new Date();

    if (!eventHasCompleted) {
      throw createAppError(
        'Certificate will be available after the event is completed.',
        400,
      );
    }

    if (!registration.certificateIssuedAt) {
      registration = await localStore.updateRegistration(registration._id, {
        certificateIssuedAt: new Date(),
        certificateNumber: buildCertificateNumber(registration),
      });
    }

    const buffer = await generateCertificateBuffer({
      registration,
      user,
      event,
    });

    return {
      filename: `${event.title.replace(/\s+/g, '-').toLowerCase()}-certificate.pdf`,
      buffer,
    };
  }

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
