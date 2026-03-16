const eventService = require('../services/event.service');

const listPublicEvents = async (req, res) => {
  const events = await eventService.listPublicEvents();

  res.status(200).json({
    success: true,
    data: events,
  });
};

const getPublicEventById = async (req, res) => {
  const event = await eventService.getPublicEventById(req.params.eventId);

  res.status(200).json({
    success: true,
    data: event,
  });
};

const listAdminEvents = async (req, res) => {
  const events = await eventService.listAdminEvents();

  res.status(200).json({
    success: true,
    data: events,
  });
};

const createEvent = async (req, res) => {
  const event = await eventService.createEvent(req.body, req.user.id);

  res.status(201).json({
    success: true,
    message: 'Event created successfully.',
    data: event,
  });
};

const updateEvent = async (req, res) => {
  const event = await eventService.updateEvent(req.params.eventId, req.body);

  res.status(200).json({
    success: true,
    message: 'Event updated successfully.',
    data: event,
  });
};

const deleteEvent = async (req, res) => {
  await eventService.deleteEvent(req.params.eventId);

  res.status(200).json({
    success: true,
    message: 'Event deleted successfully.',
  });
};

const markEventCompleted = async (req, res) => {
  const event = await eventService.markEventCompleted(req.params.eventId);

  res.status(200).json({
    success: true,
    message: 'Event marked as completed.',
    data: event,
  });
};

module.exports = {
  listPublicEvents,
  getPublicEventById,
  listAdminEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  markEventCompleted,
};
