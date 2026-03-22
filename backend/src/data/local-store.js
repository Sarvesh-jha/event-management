const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

const env = require('../config/env');
const { buildSampleEvents } = require('./sample-events');

const LOCAL_STORE_VERSION = 1;

let state;
let initialized = false;
let writeQueue = Promise.resolve();

const createObjectId = () => crypto.randomBytes(12).toString('hex');
const nowIso = () => new Date().toISOString();
const clone = (value) => JSON.parse(JSON.stringify(value));

const withArray = (value) => (Array.isArray(value) ? value : []);

const toIsoString = (value, fallback = null) => {
  if (!value) {
    return fallback;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
};

const withoutPassword = (user) => {
  if (!user) {
    return null;
  }

  const { password, ...rest } = user;
  void password;
  return rest;
};

const createDefaultState = () => ({
  meta: {
    version: LOCAL_STORE_VERSION,
    storage: 'local-file',
    initializedAt: nowIso(),
    updatedAt: nowIso(),
  },
  users: [],
  events: [],
  registrations: [],
  notifications: [],
});

const persistState = async () => {
  if (!state) {
    return;
  }

  state.meta.updatedAt = nowIso();
  const payload = JSON.stringify(state, null, 2);

  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(path.dirname(env.localDataFile), { recursive: true });
    await fs.writeFile(env.localDataFile, payload, 'utf8');
  });

  await writeQueue;
};

const loadState = async () => {
  if (initialized && state) {
    return state;
  }

  try {
    const raw = await fs.readFile(env.localDataFile, 'utf8');
    const parsed = JSON.parse(raw);

    state = {
      ...createDefaultState(),
      ...parsed,
      meta: {
        ...createDefaultState().meta,
        ...(parsed.meta || {}),
      },
      users: withArray(parsed.users),
      events: withArray(parsed.events),
      registrations: withArray(parsed.registrations),
      notifications: withArray(parsed.notifications),
    };
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }

    state = createDefaultState();
    await persistState();
  }

  initialized = true;
  return state;
};

const initializeLocalStore = async () => {
  await loadState();
  await ensureAdminUser();
  await ensureDemoEvents();
  return getStoreSnapshot();
};

const getStoreSnapshot = () =>
  clone(
    state || {
      meta: {
        version: LOCAL_STORE_VERSION,
        storage: 'local-file',
      },
    },
  );

const ensureAdminUser = async ({ resetPassword = false } = {}) => {
  await loadState();

  const email = env.adminSeedEmail.toLowerCase();
  const existingAdminIndex = state.users.findIndex((user) => user.email === email);

  if (existingAdminIndex >= 0 && state.users[existingAdminIndex].role !== 'admin') {
    throw new Error(
      `User ${env.adminSeedEmail} already exists and is not an admin account.`,
    );
  }

  if (existingAdminIndex >= 0) {
    const admin = state.users[existingAdminIndex];
    let hasChanges = false;

    if (admin.fullName !== env.adminSeedName) {
      admin.fullName = env.adminSeedName;
      hasChanges = true;
    }

    if (admin.department !== 'Administration') {
      admin.department = 'Administration';
      hasChanges = true;
    }

    if (!admin.isActive) {
      admin.isActive = true;
      hasChanges = true;
    }

    if (resetPassword) {
      admin.password = await bcrypt.hash(env.adminSeedPassword, 12);
      hasChanges = true;
    }

    if (hasChanges) {
      admin.updatedAt = nowIso();
      await persistState();
    }

    return clone(admin);
  }

  const adminUser = {
    _id: createObjectId(),
    fullName: env.adminSeedName,
    email,
    password: await bcrypt.hash(env.adminSeedPassword, 12),
    role: 'admin',
    department: 'Administration',
    studentId: null,
    isActive: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  state.users.push(adminUser);
  await persistState();

  return clone(adminUser);
};

const ensureDemoEvents = async () => {
  await loadState();

  if (state.events.length > 0) {
    return clone(state.events);
  }

  const adminUser = await ensureAdminUser();
  const timestamp = nowIso();

  state.events.push(
    ...buildSampleEvents(adminUser._id).map((event) => ({
      _id: createObjectId(),
      title: event.title,
      shortDescription: event.shortDescription,
      description: event.description,
      category: event.category,
      department: event.department,
      startDate: toIsoString(event.startDate),
      endDate: toIsoString(event.endDate),
      venue: event.venue,
      mode: event.mode,
      capacity: Number(event.capacity),
      registeredCount: Number(event.registeredCount || 0),
      organizer: event.organizer,
      keynote: event.keynote || '',
      tags: withArray(event.tags),
      coverGradient: event.coverGradient,
      agenda: withArray(event.agenda),
      status: event.status || 'published',
      createdBy: event.createdBy,
      createdAt: timestamp,
      updatedAt: timestamp,
    })),
  );

  await persistState();

  return clone(state.events);
};

const findUserByEmail = async (email, { includePassword = false } = {}) => {
  await loadState();

  const user = state.users.find((item) => item.email === email.toLowerCase());
  if (!user) {
    return null;
  }

  return clone(includePassword ? user : withoutPassword(user));
};

const findUserByStudentId = async (studentId, { includePassword = false } = {}) => {
  await loadState();

  const user = state.users.find((item) => item.studentId === studentId);
  if (!user) {
    return null;
  }

  return clone(includePassword ? user : withoutPassword(user));
};

const findUserById = async (userId, { includePassword = false } = {}) => {
  await loadState();

  const user = state.users.find((item) => item._id === userId);
  if (!user) {
    return null;
  }

  return clone(includePassword ? user : withoutPassword(user));
};

const createUser = async ({
  fullName,
  email,
  password,
  role = 'student',
  department = '',
  studentId = null,
  isActive = true,
}) => {
  await loadState();

  const timestamp = nowIso();
  const user = {
    _id: createObjectId(),
    fullName,
    email,
    password: await bcrypt.hash(password, 12),
    role,
    department,
    studentId,
    isActive,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  state.users.push(user);
  await persistState();

  return clone(withoutPassword(user));
};

const updateUser = async (userId, updates = {}) => {
  await loadState();

  const user = state.users.find((item) => item._id === userId);
  if (!user) {
    return null;
  }

  Object.assign(user, {
    ...updates,
    updatedAt: nowIso(),
  });

  if (typeof updates.password === 'string' && updates.password.trim()) {
    user.password = await bcrypt.hash(updates.password, 12);
  }

  await persistState();

  return clone(withoutPassword(user));
};

const listUsers = async ({ includePassword = false } = {}) => {
  await loadState();
  return clone(
    includePassword ? state.users : state.users.map((user) => withoutPassword(user)),
  );
};

const listEvents = async () => {
  await loadState();
  return clone(state.events);
};

const findEventById = async (eventId) => {
  await loadState();

  const event = state.events.find((item) => item._id === eventId);
  return event ? clone(event) : null;
};

const countEvents = async () => {
  await loadState();
  return state.events.length;
};

const createEvent = async (payload) => {
  await loadState();

  const timestamp = nowIso();
  const event = {
    _id: createObjectId(),
    title: payload.title,
    shortDescription: payload.shortDescription,
    description: payload.description,
    category: payload.category,
    department: payload.department,
    startDate: toIsoString(payload.startDate),
    endDate: toIsoString(payload.endDate),
    venue: payload.venue,
    mode: payload.mode,
    capacity: Number(payload.capacity),
    registeredCount: Number(payload.registeredCount || 0),
    organizer: payload.organizer,
    keynote: payload.keynote || '',
    tags: withArray(payload.tags),
    coverGradient: payload.coverGradient,
    agenda: withArray(payload.agenda),
    status: payload.status || 'published',
    createdBy: payload.createdBy,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  state.events.push(event);
  await persistState();

  return clone(event);
};

const updateEvent = async (eventId, updates) => {
  await loadState();

  const event = state.events.find((item) => item._id === eventId);
  if (!event) {
    return null;
  }

  Object.assign(event, {
    ...updates,
    startDate:
      updates.startDate !== undefined ? toIsoString(updates.startDate) : event.startDate,
    endDate: updates.endDate !== undefined ? toIsoString(updates.endDate) : event.endDate,
    updatedAt: nowIso(),
  });

  await persistState();

  return clone(event);
};

const deleteEvent = async (eventId) => {
  await loadState();

  const eventIndex = state.events.findIndex((item) => item._id === eventId);
  if (eventIndex === -1) {
    return false;
  }

  state.events.splice(eventIndex, 1);
  await persistState();
  return true;
};

const insertEvents = async (events) => {
  await loadState();

  const timestamp = nowIso();

  state.events.push(
    ...events.map((event) => ({
      _id: event._id || createObjectId(),
      title: event.title,
      shortDescription: event.shortDescription,
      description: event.description,
      category: event.category,
      department: event.department,
      startDate: toIsoString(event.startDate),
      endDate: toIsoString(event.endDate),
      venue: event.venue,
      mode: event.mode,
      capacity: Number(event.capacity),
      registeredCount: Number(event.registeredCount || 0),
      organizer: event.organizer,
      keynote: event.keynote || '',
      tags: withArray(event.tags),
      coverGradient: event.coverGradient,
      agenda: withArray(event.agenda),
      status: event.status || 'published',
      createdBy: event.createdBy,
      createdAt: toIsoString(event.createdAt, timestamp),
      updatedAt: toIsoString(event.updatedAt, timestamp),
    })),
  );

  await persistState();
  return clone(state.events);
};

const listRegistrations = async () => {
  await loadState();
  return clone(state.registrations);
};

const findRegistrationById = async (registrationId) => {
  await loadState();

  const registration = state.registrations.find((item) => item._id === registrationId);
  return registration ? clone(registration) : null;
};

const findRegistrationByEventAndUser = async ({ eventId, userId }) => {
  await loadState();

  const registration = state.registrations.find(
    (item) => item.event === eventId && item.user === userId,
  );

  return registration ? clone(registration) : null;
};

const findRegistrationByQrCodeToken = async (qrCodeToken) => {
  await loadState();

  const registration = state.registrations.find(
    (item) => item.qrCodeToken === qrCodeToken,
  );

  return registration ? clone(registration) : null;
};

const createRegistration = async ({
  user,
  event,
  note = '',
  status = 'confirmed',
  qrCodeToken,
}) => {
  await loadState();

  const timestamp = nowIso();
  const registration = {
    _id: createObjectId(),
    user,
    event,
    note,
    status,
    qrCodeToken,
    checkedIn: false,
    checkedInAt: null,
    checkedInBy: null,
    confirmationEmailSentAt: null,
    reminderSentAt: null,
    certificateIssuedAt: null,
    certificateNumber: '',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  state.registrations.push(registration);
  await persistState();

  return clone(registration);
};

const updateRegistration = async (registrationId, updates) => {
  await loadState();

  const registration = state.registrations.find((item) => item._id === registrationId);
  if (!registration) {
    return null;
  }

  Object.assign(registration, {
    ...updates,
    checkedInAt:
      updates.checkedInAt !== undefined
        ? toIsoString(updates.checkedInAt, null)
        : registration.checkedInAt,
    checkedInBy:
      updates.checkedInBy !== undefined ? updates.checkedInBy : registration.checkedInBy,
    confirmationEmailSentAt:
      updates.confirmationEmailSentAt !== undefined
        ? toIsoString(updates.confirmationEmailSentAt, null)
        : registration.confirmationEmailSentAt,
    reminderSentAt:
      updates.reminderSentAt !== undefined
        ? toIsoString(updates.reminderSentAt, null)
        : registration.reminderSentAt,
    certificateIssuedAt:
      updates.certificateIssuedAt !== undefined
        ? toIsoString(updates.certificateIssuedAt, null)
        : registration.certificateIssuedAt,
    updatedAt: nowIso(),
  });

  await persistState();

  return clone(registration);
};

const deleteRegistrationsByEvent = async (eventId) => {
  await loadState();
  state.registrations = state.registrations.filter((item) => item.event !== eventId);
  await persistState();
};

const listNotifications = async () => {
  await loadState();
  return clone(state.notifications);
};

const createNotification = async ({
  user,
  event = null,
  type,
  channel = 'in-app',
  title,
  message,
  status = 'sent',
  sentAt = new Date(),
  isRead = false,
  metadata = {},
}) => {
  await loadState();

  const timestamp = nowIso();
  const notification = {
    _id: createObjectId(),
    user,
    event,
    type,
    channel,
    title,
    message,
    status,
    sentAt: toIsoString(sentAt),
    isRead,
    metadata,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  state.notifications.push(notification);
  await persistState();

  return clone(notification);
};

const updateNotification = async (notificationId, updates) => {
  await loadState();

  const notification = state.notifications.find((item) => item._id === notificationId);
  if (!notification) {
    return null;
  }

  Object.assign(notification, {
    ...updates,
    sentAt:
      updates.sentAt !== undefined ? toIsoString(updates.sentAt, null) : notification.sentAt,
    updatedAt: nowIso(),
  });

  await persistState();

  return clone(notification);
};

const deleteNotificationsByEvent = async (eventId) => {
  await loadState();
  state.notifications = state.notifications.filter((item) => item.event !== eventId);
  await persistState();
};

module.exports = {
  initializeLocalStore,
  getStoreSnapshot,
  ensureAdminUser,
  ensureDemoEvents,
  findUserByEmail,
  findUserByStudentId,
  findUserById,
  createUser,
  updateUser,
  listUsers,
  listEvents,
  findEventById,
  countEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  insertEvents,
  listRegistrations,
  findRegistrationById,
  findRegistrationByEventAndUser,
  findRegistrationByQrCodeToken,
  createRegistration,
  updateRegistration,
  deleteRegistrationsByEvent,
  listNotifications,
  createNotification,
  updateNotification,
  deleteNotificationsByEvent,
};
