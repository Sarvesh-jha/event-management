const express = require('express');

const analyticsRoutes = require('./analytics.routes');
const authRoutes = require('./auth.routes');
const eventsRoutes = require('./events.routes');
const notificationsRoutes = require('./notifications.routes');
const registrationsRoutes = require('./registrations.routes');
const { getHealthStatus } = require('../controllers/health.controller');

const router = express.Router();

router.get('/health', getHealthStatus);
router.use('/auth', authRoutes);
router.use('/events', eventsRoutes);
router.use('/registrations', registrationsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/analytics', analyticsRoutes);

module.exports = router;
