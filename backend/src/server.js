const http = require('http');
const mongoose = require('mongoose');

const app = require('./app');
const env = require('./config/env');
const connectDatabase = require('./config/database');
const { startReminderJob } = require('./jobs/reminder.job');

const startServer = async () => {
  try {
    await connectDatabase();
    startReminderJob();

    const server = http.createServer(app);

    server.listen(env.port, () => {
      console.log(
        `Server is running on port ${env.port} in ${env.nodeEnv} mode.`,
      );
    });

    const shutdown = async (signal) => {
      console.log(`${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        await mongoose.connection.close();
        console.log('MongoDB connection closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('Unable to start the server:', error.message);
    process.exit(1);
  }
};

startServer();
