const env = require('../config/env');
const { getDatabaseState } = require('../config/database');

const getHealthStatus = (req, res) => {
  const databaseState = getDatabaseState();

  res.status(200).json({
    success: true,
    message: 'API and storage look healthy.',
    environment: env.nodeEnv,
    database: databaseState.connected ? 'connected' : 'disconnected',
    storageMode: databaseState.mode,
    storageMessage: databaseState.message,
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  getHealthStatus,
};
