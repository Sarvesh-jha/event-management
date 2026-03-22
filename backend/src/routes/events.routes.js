const express = require('express');

const {
  createEvent,
  deleteEvent,
  getPublicEventById,
  listAdminEvents,
  listPublicEvents,
  markEventCompleted,
  updateEvent,
} = require('../controllers/event.controller');
const { registerForEvent } = require('../controllers/registration.controller');
const { authorize, protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/admin/list/all', protect, authorize('admin'), listAdminEvents);
router.post('/', protect, authorize('admin'), createEvent);
router.put('/:eventId', protect, authorize('admin'), updateEvent);
router.delete('/:eventId', protect, authorize('admin'), deleteEvent);
router.patch('/:eventId/complete', protect, authorize('admin'), markEventCompleted);

router.get('/', listPublicEvents);
router.get('/:eventId', getPublicEventById);
router.post('/:eventId/register', protect, registerForEvent);

module.exports = router;
