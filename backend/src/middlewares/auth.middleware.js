const User = require('../models/user.model');
const { isUsingLocalDatabase } = require('../config/database');
const localStore = require('../data/local-store');
const createAppError = require('../utils/app-error');
const { verifyToken } = require('../utils/jwt');
const sanitizeUser = require('../utils/sanitize-user');

const extractBearerToken = (authorizationHeader = '') => {
  if (!authorizationHeader.startsWith('Bearer ')) {
    return null;
  }

  return authorizationHeader.split(' ')[1];
};

const protect = async (req, res, next) => {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    next(createAppError('Authorization token is required.', 401));
    return;
  }

  try {
    const decodedToken = verifyToken(token);

    // We re-fetch the user on every request so deactivated accounts cannot keep using old tokens.
    const user = isUsingLocalDatabase()
      ? await localStore.findUserById(decodedToken.sub)
      : await User.findById(decodedToken.sub);

    if (!user || !user.isActive) {
      next(createAppError('User account is no longer available.', 401));
      return;
    }

    req.user = {
      id: user._id.toString(),
      ...sanitizeUser(user),
    };

    next();
  } catch (error) {
    next(createAppError('Invalid or expired authentication token.', 401));
  }
};

const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      next(createAppError('Authentication is required for this action.', 401));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(createAppError('You do not have permission to access this resource.', 403));
      return;
    }

    next();
  };

module.exports = {
  protect,
  authorize,
};
