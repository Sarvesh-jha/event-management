const Notification = require('../models/notification.model');
const Registration = require('../models/registration.model');
const { isUsingLocalDatabase } = require('../config/database');
const localStore = require('../data/local-store');
const { sendUpcomingReminderEmail } = require('./email.service');

const createNotification = async ({
  userId,
  eventId = null,
  type,
  channel = 'in-app',
  title,
  message,
  status = 'sent',
  metadata = {},
}) =>
  isUsingLocalDatabase()
    ? localStore.createNotification({
        user: userId,
        event: eventId,
        type,
        channel,
        title,
        message,
        status,
        sentAt: new Date(),
        metadata,
      })
    : Notification.create({
        user: userId,
        event: eventId,
        type,
        channel,
        title,
        message,
        status,
        sentAt: new Date(),
        metadata,
      });

const createRegistrationConfirmationNotification = async ({ user, event, registration }) =>
  createNotification({
    userId: user._id,
    eventId: event._id,
    type: 'registration-confirmation',
    title: 'Registration confirmed',
    message: `You are registered for ${event.title} on ${new Date(event.startDate).toLocaleString()}.`,
    metadata: {
      registrationId: registration._id.toString(),
    },
  });

const createCheckInNotification = async ({ user, event, registration }) =>
  createNotification({
    userId: user._id,
    eventId: event._id,
    type: 'check-in',
    title: 'Check-in completed',
    message: `Your attendance for ${event.title} has been recorded successfully.`,
    metadata: {
      registrationId: registration._id.toString(),
    },
  });

const listUserNotifications = async (userId) => {
  if (isUsingLocalDatabase()) {
    const notifications = (await localStore.listNotifications())
      .filter((notification) => notification.user === userId)
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      )
      .slice(0, 20);

    return Promise.all(
      notifications.map(async (notification) => {
        const event = notification.event
          ? await localStore.findEventById(notification.event)
          : null;

        return {
          id: notification._id.toString(),
          type: notification.type,
          channel: notification.channel,
          title: notification.title,
          message: notification.message,
          status: notification.status,
          isRead: notification.isRead,
          sentAt: notification.sentAt,
          createdAt: notification.createdAt,
          event: event
            ? {
                id: event._id.toString(),
                title: event.title,
              }
            : null,
        };
      }),
    );
  }

  const notifications = await Notification.find({ user: userId })
    .populate('event')
    .sort({ createdAt: -1 })
    .limit(20);

  return notifications.map((notification) => ({
    id: notification._id.toString(),
    type: notification.type,
    channel: notification.channel,
    title: notification.title,
    message: notification.message,
    status: notification.status,
    isRead: notification.isRead,
    sentAt: notification.sentAt,
    createdAt: notification.createdAt,
    event: notification.event
      ? {
          id: notification.event._id.toString(),
          title: notification.event.title,
        }
      : null,
  }));
};

const markNotificationAsRead = async (notificationId, userId) => {
  if (isUsingLocalDatabase()) {
    const notifications = await localStore.listNotifications();
    const notification = notifications.find(
      (item) => item._id === notificationId && item.user === userId,
    );

    if (!notification) {
      return null;
    }

    return localStore.updateNotification(notificationId, {
      isRead: true,
    });
  }

  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { isRead: true },
    { new: true },
  );

  return notification;
};

const processUpcomingReminders = async ({ hoursAhead = 24 } = {}) => {
  const now = new Date();
  const upcomingWindow = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

  if (isUsingLocalDatabase()) {
    const registrations = (await localStore.listRegistrations()).filter(
      (registration) =>
        registration.status === 'confirmed' && registration.reminderSentAt === null,
    );

    let reminderCount = 0;

    for (const registration of registrations) {
      const [user, event] = await Promise.all([
        localStore.findUserById(registration.user),
        localStore.findEventById(registration.event),
      ]);

      if (
        !event ||
        !user ||
        event.status === 'draft' ||
        new Date(event.startDate) <= now ||
        new Date(event.startDate) > upcomingWindow
      ) {
        continue;
      }

      await sendUpcomingReminderEmail({ user, event });

      await createNotification({
        userId: user._id,
        eventId: event._id,
        type: 'upcoming-reminder',
        title: 'Upcoming event reminder',
        message: `${event.title} begins on ${new Date(event.startDate).toLocaleString()}.`,
        metadata: {
          registrationId: registration._id.toString(),
        },
      });

      await localStore.updateRegistration(registration._id, {
        reminderSentAt: new Date(),
      });
      reminderCount += 1;
    }

    return {
      processedAt: now,
      reminderCount,
    };
  }

  const registrations = await Registration.find({
    status: 'confirmed',
    reminderSentAt: null,
  })
    .populate('user')
    .populate('event');

  let reminderCount = 0;

  for (const registration of registrations) {
    const event = registration.event;
    const user = registration.user;

    if (
      !event ||
      !user ||
      event.status === 'draft' ||
      new Date(event.startDate) <= now ||
      new Date(event.startDate) > upcomingWindow
    ) {
      continue;
    }

    await sendUpcomingReminderEmail({ user, event });

    await createNotification({
      userId: user._id,
      eventId: event._id,
      type: 'upcoming-reminder',
      title: 'Upcoming event reminder',
      message: `${event.title} begins on ${new Date(event.startDate).toLocaleString()}.`,
      metadata: {
        registrationId: registration._id.toString(),
      },
    });

    registration.reminderSentAt = new Date();
    await registration.save();
    reminderCount += 1;
  }

  return {
    processedAt: now,
    reminderCount,
  };
};

module.exports = {
  createNotification,
  createRegistrationConfirmationNotification,
  createCheckInNotification,
  listUserNotifications,
  markNotificationAsRead,
  processUpcomingReminders,
};
