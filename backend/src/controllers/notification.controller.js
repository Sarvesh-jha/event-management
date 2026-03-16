const mongoose = require('mongoose');

const notificationService = require('../services/notification.service');
const createAppError = require('../utils/app-error');

const listMyNotifications = async (req, res) => {
  const notifications = await notificationService.listUserNotifications(req.user.id);

  res.status(200).json({
    success: true,
    data: notifications,
  });
};

const markNotificationAsRead = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.notificationId)) {
    throw createAppError('Invalid notification id.', 400);
  }

  const notification = await notificationService.markNotificationAsRead(
    req.params.notificationId,
    req.user.id,
  );

  if (!notification) {
    throw createAppError('Notification not found.', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Notification marked as read.',
  });
};

const processUpcomingReminders = async (req, res) => {
  const result = await notificationService.processUpcomingReminders();

  res.status(200).json({
    success: true,
    message: 'Reminder processing completed.',
    data: result,
  });
};

module.exports = {
  listMyNotifications,
  markNotificationAsRead,
  processUpcomingReminders,
};
