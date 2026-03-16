const authService = require('../services/auth.service');

const registerStudent = async (req, res) => {
  const authResult = await authService.registerStudent(req.body);

  res.status(201).json({
    success: true,
    message: authResult.message,
    data: {
      token: authResult.token,
      user: authResult.user,
    },
  });
};

const loginUser = async (req, res) => {
  const authResult = await authService.loginUser(req.body);

  res.status(200).json({
    success: true,
    message: authResult.message,
    data: {
      token: authResult.token,
      user: authResult.user,
    },
  });
};

const getCurrentUser = async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);

  res.status(200).json({
    success: true,
    message: 'Authenticated user retrieved successfully.',
    data: {
      user,
    },
  });
};

module.exports = {
  registerStudent,
  loginUser,
  getCurrentUser,
};
