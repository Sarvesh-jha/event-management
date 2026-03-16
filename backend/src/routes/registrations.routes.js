const express = require('express');

const {
  downloadCertificate,
  getMyRegistrationForEvent,
  getMyRegistrations,
  verifyCheckIn,
} = require('../controllers/registration.controller');
const { authorize, protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/me', protect, getMyRegistrations);
router.get('/event/:eventId/me', protect, getMyRegistrationForEvent);
router.post('/verify-checkin', protect, authorize('admin'), verifyCheckIn);
router.get('/:registrationId/certificate', protect, downloadCertificate);

module.exports = router;
