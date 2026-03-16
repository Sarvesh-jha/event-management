const env = require('../config/env');

const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal server error.',
    stack: env.nodeEnv === 'development' ? error.stack : undefined,
  });
};

module.exports = errorHandler;
