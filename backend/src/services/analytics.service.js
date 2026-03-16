const Event = require('../models/event.model');
const Notification = require('../models/notification.model');
const Registration = require('../models/registration.model');
const sanitizeEvent = require('../utils/sanitize-event');

const toRoundedPercentage = (value) => Math.round(value * 100) / 100;

const getDashboardSummary = async () => {
  const now = new Date();
  const [events, registrations, recentNotifications] = await Promise.all([
    Event.find({ status: { $ne: 'draft' } }).sort({ startDate: 1 }),
    Registration.find({})
      .populate('event')
      .populate('user')
      .sort({ createdAt: -1 }),
    Notification.find().populate('event').sort({ createdAt: -1 }).limit(3),
  ]);

  const totalEvents = events.length;
  const totalRegistrations = registrations.length;
  const upcomingEvents = events.filter((event) => new Date(event.startDate) > now).length;

  const avgOccupancy =
    totalEvents === 0
      ? 0
      : toRoundedPercentage(
          events.reduce((total, event) => total + event.registeredCount / event.capacity, 0) /
            totalEvents *
            100,
        );

  const confirmedRegistrations = registrations.filter(
    (registration) => registration.status === 'confirmed',
  ).length;
  const checkedInRegistrations = registrations.filter(
    (registration) => registration.checkedIn,
  ).length;

  const checkInRate =
    confirmedRegistrations === 0
      ? 0
      : Math.round((checkedInRegistrations / confirmedRegistrations) * 100);

  const completedRegistrations = registrations.filter((registration) => {
    if (!registration.event) {
      return false;
    }

    return (
      registration.checkedIn &&
      (registration.event.status === 'completed' ||
        new Date(registration.event.endDate) <= now)
    );
  }).length;

  const completionBase = registrations.filter((registration) => registration.checkedIn).length;
  const completionRate =
    completionBase === 0 ? 0 : Math.round((completedRegistrations / completionBase) * 100);

  const categoryMap = new Map();
  const modeMap = new Map();

  for (const event of events) {
    categoryMap.set(
      event.category,
      (categoryMap.get(event.category) || 0) + event.registeredCount,
    );
    modeMap.set(event.mode, (modeMap.get(event.mode) || 0) + 1);
  }

  const topCategories = [...categoryMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 5);

  const featuredEvents = events
    .filter((event) => event.status === 'published')
    .sort((left, right) => right.registeredCount - left.registeredCount)
    .slice(0, 3)
    .map(sanitizeEvent);

  const recentActivity = recentNotifications.map((notification) => ({
    title: notification.title,
    detail: notification.message,
    time: notification.createdAt.toLocaleString(),
  }));

  const registrationTrendMap = new Map();
  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - index);
    const key = date.toISOString().slice(0, 10);
    registrationTrendMap.set(key, 0);
  }

  for (const registration of registrations) {
    const key = registration.createdAt.toISOString().slice(0, 10);
    if (registrationTrendMap.has(key)) {
      registrationTrendMap.set(key, registrationTrendMap.get(key) + 1);
    }
  }

  const registrationTrend = [...registrationTrendMap.entries()].map(([label, value]) => ({
    label,
    value,
  }));

  const attendanceTrend = [...registrationTrendMap.keys()].map((label) => ({
    label,
    value: registrations.filter(
      (registration) =>
        registration.checkedIn &&
        registration.checkedInAt &&
        registration.checkedInAt.toISOString().slice(0, 10) === label,
    ).length,
  }));

  const modeBreakdown = [...modeMap.entries()].map(([label, value]) => ({ label, value }));

  return {
    totalEvents,
    totalRegistrations,
    upcomingEvents,
    avgOccupancy,
    checkInRate,
    completionRate,
    topCategories,
    featuredEvents,
    recentActivity,
    registrationTrend,
    attendanceTrend,
    modeBreakdown,
  };
};

module.exports = {
  getDashboardSummary,
};
