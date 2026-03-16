const mongoose = require('mongoose');

const env = require('./env');

const connectDatabase = async () => {
  try {
    // Fail fast during startup if the database is unavailable.
    await mongoose.connect(env.mongodbUri);
    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
};

module.exports = connectDatabase;
