const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');
const migrate = require('../src/db/migrate');

async function resetDb() {
  await migrate();
  await db.query('TRUNCATE readings, users RESTART IDENTITY CASCADE');
}

let userCounter = 0;

/** Signs up a fresh user and returns { user, token, auth } where auth is the header value. */
async function createUser(overrides = {}) {
  userCounter += 1;
  const body = {
    name: `User ${userCounter}`,
    email: `user${userCounter}@example.com`,
    password: 'password123',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/signup').send(body).expect(201);
  return { ...res.body, auth: `Bearer ${res.body.token}` };
}

const addReading = (auth, body) =>
  request(app).post('/api/readings').set('Authorization', auth).send(body);

module.exports = { app, db, request, resetDb, createUser, addReading };
