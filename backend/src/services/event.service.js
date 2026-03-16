const mongoose = require('mongoose');

const Event = require('../models/event.model');
const Notification = require('../models/notification.model');
const Registration = require('../models/registration.model');
const createAppError = require('../utils/app-error');
const sanitizeEvent = require('../utils/sanitize-event');

const ensureValidObjectId = (value, label) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw createAppError(`Invalid ${label}.`, 400);
  }
};

const normalizeEventPayload = (payload) => ({
  title: payload.title?.trim(),
  shortDescription: payload.shortDescription?.trim(),
  description: payload.description?.trim(),
  category: payload.category?.trim(),
  department: payload.department?.trim(),
  startDate: payload.startDate,
  endDate: payload.endDate,
  venue: payload.venue?.trim(),
  mode: payload.mode,
  capacity: Number(payload.capacity),
  organizer: payload.organizer?.trim(),
  keynote: payload.keynote?.trim() || '',
  tags: Array.isArray(payload.tags)
    ? payload.tags.map((tag) => String(tag).trim()).filter(Boolean)
    : String(payload.tags || '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
  coverGradient: payload.coverGradient?.trim(),
  agenda: Array.isArray(payload.agenda) ? payload.agenda : [],
  status: payload.status || 'published',
});

const validateEventPayload = (eventPayload) => {
  const requiredFields = [
    'title',
    'shortDescription',
    'description',
    'category',
    'department',
    'startDate',
    'endDate',
    'venue',
    'mode',
    'capacity',
    'organizer',
  ];

  for (const field of requiredFields) {
    if (!eventPayload[field]) {
      throw createAppError(`${field} is required.`, 400);
    }
  }

  if (Number.isNaN(eventPayload.capacity) || eventPayload.capacity < 1) {
    throw createAppError('capacity must be a positive number.', 400);
  }

  if (new Date(eventPayload.endDate) <= new Date(eventPayload.startDate)) {
    throw createAppError('endDate must be after startDate.', 400);
  }
};

const listPublicEvents = async () => {
  const events = await Event.find({
    status: { $in: ['published', 'completed'] },
  }).sort({ startDate: 1 });

  return events.map(sanitizeEvent);
};

const getEventById = async (eventId, { includeDraft = false } = {}) => {
  ensureValidObjectId(eventId, 'event id');

  const query = includeDraft
    ? { _id: eventId }
    : { _id: eventId, status: { $in: ['published', 'completed'] } };

  const event = await Event.findOne(query);

  if (!event) {
    throw createAppError('Event not found.', 404);
  }

  return event;
};

const getPublicEventById = async (eventId) => sanitizeEvent(await getEventById(eventId));

const listAdminEvents = async () => {
  const events = await Event.find().sort({ createdAt: -1 });

  return events.map(sanitizeEvent);
};

const createEvent = async (payload, adminUserId) => {
  const eventPayload = normalizeEventPayload(payload);
  validateEventPayload(eventPayload);

  const event = await Event.create({
    ...eventPayload,
    createdBy: adminUserId,
  });

  return sanitizeEvent(event);
};

const updateEvent = async (eventId, payload) => {
  const event = await getEventById(eventId, { includeDraft: true });
  const normalizedPayload = normalizeEventPayload(payload);

  validateEventPayload({
    ...sanitizeEvent(event),
    ...normalizedPayload,
  });

  Object.assign(event, normalizedPayload);
  await event.save();

  return sanitizeEvent(event);
};

const deleteEvent = async (eventId) => {
  const event = await getEventById(eventId, { includeDraft: true });

  await Registration.deleteMany({ event: event._id });
  await Notification.deleteMany({ event: event._id });
  await Event.findByIdAndDelete(event._id);
};

const markEventCompleted = async (eventId) => {
  const event = await getEventById(eventId, { includeDraft: true });
  event.status = 'completed';
  await event.save();

  return sanitizeEvent(event);
};

module.exports = {
  listPublicEvents,
  getPublicEventById,
  getEventById,
  listAdminEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  markEventCompleted,
};
