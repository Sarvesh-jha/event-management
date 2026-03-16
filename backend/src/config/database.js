const mongoose = require('mongoose');

const env = require('./env');

const connectDatabase = async () => {
  try {
    await mongoose.connect(env.mongodbUri);
    console.log('MongoDB connection is ready.');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
};

module.exports = connectDatabase;
