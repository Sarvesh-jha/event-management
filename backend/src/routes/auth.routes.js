const express = require('express');

const {
  getCurrentUser,
  loginUser,
  registerStudent,
} = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/register', registerStudent);
router.post('/login', loginUser);
router.get('/me', protect, getCurrentUser);

module.exports = router;
