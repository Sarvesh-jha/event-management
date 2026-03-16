const dotenv = require('dotenv');

dotenv.config();

// Keeping environment access in one place makes later phases easier to scale.
const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri:
    process.env.MONGODB_URI ||
    'mongodb://127.0.0.1:27017/smart-campus-events',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:4200',
  jwtSecret:
    process.env.JWT_SECRET || 'smart-campus-events-dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  adminSeedName: process.env.ADMIN_SEED_NAME || 'Campus Admin',
  adminSeedEmail: process.env.ADMIN_SEED_EMAIL || 'admin@campus.edu',
  adminSeedPassword: process.env.ADMIN_SEED_PASSWORD || 'Admin@12345',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT) || 587,
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  fromEmail: process.env.FROM_EMAIL || 'no-reply@smartcampus.local',
  enableReminderJob: process.env.ENABLE_REMINDER_JOB !== 'false',
};

module.exports = env;
