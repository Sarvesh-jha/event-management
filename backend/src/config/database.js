const mongoose = require('mongoose');

const env = require('./env');
const { initializeLocalStore } = require('../data/local-store');

const databaseState = {
  mode: 'mongo',
  connected: false,
  message: '',
};

const connectDatabase = async () => {
  if (databaseState.connected) {
    return databaseState;
  }

  try {
    await mongoose.connect(env.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
    });
    databaseState.mode = 'mongo';
    databaseState.connected = true;
    databaseState.message = 'MongoDB connection is ready.';
    console.log('MongoDB connection is ready.');
    return databaseState;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);

    if (!env.enableLocalDbFallback) {
      throw error;
    }

    await initializeLocalStore();

    databaseState.mode = 'local';
    databaseState.connected = true;
    databaseState.message = `Using local file-backed storage because MongoDB is unavailable: ${error.message}`;

    console.warn(databaseState.message);
    return databaseState;
  }
};

module.exports = connectDatabase;
module.exports.getDatabaseState = () => ({ ...databaseState });
module.exports.isUsingLocalDatabase = () => databaseState.mode === 'local';
