const jwt = require('jsonwebtoken');

const env = require('../config/env');

const generateToken = (user) =>
  jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn,
    },
  );

const verifyToken = (token) => jwt.verify(token, env.jwtSecret);

module.exports = {
  generateToken,
  verifyToken,
};
