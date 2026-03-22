const bcrypt = require('bcryptjs');

const User = require('../models/user.model');
const { isUsingLocalDatabase } = require('../config/database');
const localStore = require('../data/local-store');
const createAppError = require('../utils/app-error');
const { generateToken } = require('../utils/jwt');
const sanitizeUser = require('../utils/sanitize-user');

const normalizeEmail = (email) => email.trim().toLowerCase();
const normalizeStudentId = (studentId) => studentId.trim().toUpperCase();

const buildAuthResponse = (user, message) => ({
  token: generateToken(user),
  user: sanitizeUser(user),
  message,
});

const validateRegisterPayload = ({
  fullName,
  email,
  password,
  department,
  studentId,
}) => {
  if (!fullName || !email || !password || !department || !studentId) {
    throw createAppError(
      'fullName, email, password, department, and studentId are required.',
      400,
    );
  }

  if (password.trim().length < 8) {
    throw createAppError('Password must be at least 8 characters long.', 400);
  }
};

const validateLoginPayload = ({ email, password }) => {
  if (!email || !password) {
    throw createAppError('Email and password are required.', 400);
  }
};

const registerStudent = async ({
  fullName,
  email,
  password,
  department,
  studentId,
}) => {
  validateRegisterPayload({
    fullName,
    email,
    password,
    department,
    studentId,
  });

  const normalizedEmail = normalizeEmail(email);
  const normalizedStudentId = normalizeStudentId(studentId);

  if (isUsingLocalDatabase()) {
    const existingEmail = await localStore.findUserByEmail(normalizedEmail);

    if (existingEmail) {
      throw createAppError('An account with this email already exists.', 409);
    }

    const existingStudent = await localStore.findUserByStudentId(normalizedStudentId);

    if (existingStudent) {
      throw createAppError('This student ID is already registered.', 409);
    }

    const user = await localStore.createUser({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password: password.trim(),
      department: department.trim(),
      studentId: normalizedStudentId,
      role: 'student',
    });

    return buildAuthResponse(user, 'Student account created successfully.');
  }

  const existingEmail = await User.findOne({ email: normalizedEmail });

  if (existingEmail) {
    throw createAppError('An account with this email already exists.', 409);
  }

  const existingStudent = await User.findOne({ studentId: normalizedStudentId });

  if (existingStudent) {
    throw createAppError('This student ID is already registered.', 409);
  }

  const user = await User.create({
    fullName: fullName.trim(),
    email: normalizedEmail,
    password: password.trim(),
    department: department.trim(),
    studentId: normalizedStudentId,
    role: 'student',
  });

  return buildAuthResponse(user, 'Student account created successfully.');
};

const loginUser = async ({ email, password }) => {
  validateLoginPayload({ email, password });

  if (isUsingLocalDatabase()) {
    const user = await localStore.findUserByEmail(normalizeEmail(email), {
      includePassword: true,
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw createAppError('Invalid email or password.', 401);
    }

    if (!user.isActive) {
      throw createAppError('This account has been deactivated.', 403);
    }

    return buildAuthResponse(user, 'Login successful.');
  }

  const user = await User.findOne({ email: normalizeEmail(email) }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw createAppError('Invalid email or password.', 401);
  }

  if (!user.isActive) {
    throw createAppError('This account has been deactivated.', 403);
  }

  return buildAuthResponse(user, 'Login successful.');
};

const getCurrentUser = async (userId) => {
  if (isUsingLocalDatabase()) {
    const user = await localStore.findUserById(userId);

    if (!user || !user.isActive) {
      throw createAppError('User account not found.', 404);
    }

    return sanitizeUser(user);
  }

  const user = await User.findById(userId);

  if (!user || !user.isActive) {
    throw createAppError('User account not found.', 404);
  }

  return sanitizeUser(user);
};

module.exports = {
  registerStudent,
  loginUser,
  getCurrentUser,
};
