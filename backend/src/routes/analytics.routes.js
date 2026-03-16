const express = require('express');

const { getDashboardSummary } = require('../controllers/analytics.controller');
const { authorize, protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/events', protect, authorize('admin'), getDashboardSummary);

module.exports = router;
