const express = require('express');

const {
  listMyNotifications,
  markNotificationAsRead,
  processUpcomingReminders,
} = require('../controllers/notification.controller');
const { authorize, protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/me', protect, listMyNotifications);
router.patch('/:notificationId/read', protect, markNotificationAsRead);
router.post('/process-reminders', protect, authorize('admin'), processUpcomingReminders);

module.exports = router;
