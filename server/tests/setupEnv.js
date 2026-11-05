// Runs before every test file, before any app code is loaded.
require('dotenv').config({ quiet: true });

if (!process.env.TEST_DATABASE_URL) {
  throw new Error(
    'TEST_DATABASE_URL is not set. Tests wipe their database, so they refuse to run against DATABASE_URL.',
  );
}

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.BCRYPT_ROUNDS = '4'; // fast hashing keeps the test suite quick
process.env.APP_TIMEZONE = process.env.APP_TIMEZONE || 'Asia/Kolkata';
