const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const apiRoutes = require('./routes');
const env = require('./config/env');
const notFoundHandler = require('./middlewares/not-found.middleware');
const errorHandler = require('./middlewares/error.middleware');

const app = express();
const allowedOrigins = new Set([env.clientUrl]);

try {
  const configuredClientUrl = new URL(env.clientUrl);
  const port = configuredClientUrl.port ? `:${configuredClientUrl.port}` : '';

  if (['localhost', '127.0.0.1'].includes(configuredClientUrl.hostname)) {
    allowedOrigins.add(`${configuredClientUrl.protocol}//localhost${port}`);
    allowedOrigins.add(`${configuredClientUrl.protocol}//127.0.0.1${port}`);
  }
} catch (error) {
  console.warn(`Invalid CLIENT_URL configured for CORS: ${env.clientUrl}`);
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
    credentials: true,
  }),
);
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Smart Campus Events API is running.',
    version: 'v1',
  });
});

app.use('/api/v1', apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
