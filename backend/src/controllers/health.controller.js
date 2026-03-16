const mongoose = require('mongoose');

const env = require('../config/env');

const getHealthStatus = (req, res) => {
  const isDatabaseConnected = mongoose.connection.readyState === 1;

  res.status(200).json({
    success: true,
    message: 'API and database look healthy.',
    environment: env.nodeEnv,
    database: isDatabaseConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  getHealthStatus,
};
