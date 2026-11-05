const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const config = require('../config');
const { validateSignup, validateLogin } = require('./validation');
const { conflict, unauthorized } = require('../utils/errors');

const UNIQUE_VIOLATION = '23505';

const publicUser = (row) => ({ id: row.id, name: row.name, email: row.email });

const signToken = (user) =>
  jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

async function signup(body) {
  const { name, email, password } = validateSignup(body);
  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
  try {
    const { rows } = await db.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, passwordHash],
    );
    const user = publicUser(rows[0]);
    return { user, token: signToken(user) };
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) {
      throw conflict('An account with this email already exists.', 'email');
    }
    throw err;
  }
}

async function login(body) {
  const { email, password } = validateLogin(body);
  const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  const row = rows[0];
  // Same message for "no such user" and "wrong password" so emails can't be probed.
  const ok = row && (await bcrypt.compare(password, row.password_hash));
  if (!ok) throw unauthorized('Invalid email or password.');
  const user = publicUser(row);
  return { user, token: signToken(user) };
}

async function getUserById(id) {
  const { rows } = await db.query('SELECT id, name, email FROM users WHERE id = $1', [id]);
  return rows[0] ? publicUser(rows[0]) : null;
}

module.exports = { signup, login, getUserById };
