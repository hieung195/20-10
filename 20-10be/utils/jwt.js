const jwt = require('jsonwebtoken');
require('dotenv').config();

const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

function getSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error('Missing JWT env: JWT_SECRET');
  }
  return process.env.JWT_SECRET;
}

function signToken(payload) {
  return jwt.sign(payload, getSecret(), { expiresIn: EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, getSecret());
}

module.exports = { signToken, verifyToken };
