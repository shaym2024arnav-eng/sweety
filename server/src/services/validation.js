const { badRequest } = require('../utils/errors');
const { isValidDateString, isAfter } = require('../utils/dates');
const { SLOT_KEYS } = require('../utils/slots');

const MIN_VALUE = 40;
const MAX_VALUE = 600;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

const MESSAGES = {
  valueRequired: 'Please enter a glucose value.',
  valueRange: `Value must be between ${MIN_VALUE} and ${MAX_VALUE} mg/dl.`,
  dateRequired: 'Please choose a date.',
  dateInvalid: 'Please enter a valid date (YYYY-MM-DD).',
  dateFuture: 'Date cannot be in the future.',
  slotInvalid: 'Please choose a time slot.',
};

/**
 * Parses a glucose value. Accepts a number or a numeric string (forms send strings).
 * Returns the integer, or throws a 400 with a user-friendly message.
 */
function parseGlucoseValue(raw) {
  if (raw === undefined || raw === null || String(raw).trim() === '') {
    throw badRequest(MESSAGES.valueRequired, 'value');
  }
  const text = String(raw).trim();
  // Whole numbers only: "120" is fine, "120.5", "1e2", "12abc" are not.
  if (!/^\d+$/.test(text)) throw badRequest(MESSAGES.valueRange, 'value');

  const value = Number(text);
  if (value < MIN_VALUE || value > MAX_VALUE) throw badRequest(MESSAGES.valueRange, 'value');
  return value;
}

/** Field-level checks that don't need the database. */
function validateReadingInput(body, today) {
  const { reading_date: date, slot } = body ?? {};

  const value = parseGlucoseValue(body?.value);

  if (date === undefined || date === null || date === '') {
    throw badRequest(MESSAGES.dateRequired, 'reading_date');
  }
  if (!isValidDateString(date)) throw badRequest(MESSAGES.dateInvalid, 'reading_date');
  if (isAfter(date, today)) throw badRequest(MESSAGES.dateFuture, 'reading_date');

  if (!SLOT_KEYS.includes(slot)) throw badRequest(MESSAGES.slotInvalid, 'slot');

  return { reading_date: date, slot, value };
}

function validateSignup(body) {
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!name) throw badRequest('Please enter your name.', 'name');
  if (name.length > 100) throw badRequest('Name must be 100 characters or fewer.', 'name');
  if (!EMAIL_PATTERN.test(email)) throw badRequest('Please enter a valid email address.', 'email');
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw badRequest(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`, 'password');
  }
  if (password.length > 72) {
    // bcrypt only uses the first 72 bytes of a password
    throw badRequest('Password must be 72 characters or fewer.', 'password');
  }
  return { name, email, password };
}

function validateLogin(body) {
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!email || !password) throw badRequest('Please enter your email and password.');
  return { email, password };
}

module.exports = {
  MESSAGES,
  MIN_VALUE,
  MAX_VALUE,
  parseGlucoseValue,
  validateReadingInput,
  validateSignup,
  validateLogin,
};
