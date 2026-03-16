const cron = require('node-cron');

const env = require('../config/env');
const notificationService = require('../services/notification.service');

let reminderTask;

const startReminderJob = () => {
  if (!env.enableReminderJob || reminderTask) {
    return;
  }

  reminderTask = cron.schedule('0 * * * *', async () => {
    try {
      const result = await notificationService.processUpcomingReminders();
      if (result.reminderCount > 0) {
        console.log(`Processed ${result.reminderCount} reminder notifications.`);
      }
    } catch (error) {
      console.error('Reminder job failed:', error.message);
    }
  });

  console.log('Upcoming reminder job started.');
};

module.exports = {
  startReminderJob,
};
