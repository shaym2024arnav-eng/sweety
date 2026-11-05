const jwt = require('jsonwebtoken');
const config = require('../config');
const { getUserById } = require('../services/authService');
const { unauthorized } = require('../utils/errors');

/** Requires a valid "Authorization: Bearer <token>" header and sets req.user. */
async function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) throw unauthorized();

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw unauthorized('Your session has expired. Please log in again.');
  }

  // Make sure the account still exists (e.g. it wasn't deleted after the token was issued)
  const user = await getUserById(payload.sub);
  if (!user) throw unauthorized();

  req.user = user;
  next();
}

module.exports = { requireAuth };
