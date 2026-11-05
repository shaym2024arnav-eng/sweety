const { app, db, request, resetDb, createUser } = require('../helpers');

beforeEach(resetDb);
afterAll(() => db.pool.end());

describe('POST /api/auth/signup', () => {
  test('creates a user and stores a bcrypt hash, never the plain password', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Asha', email: 'Asha@Example.com', password: 'secret123' })
      .expect(201);

    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toEqual({ id: expect.any(Number), name: 'Asha', email: 'asha@example.com' });
    expect(res.body.user).not.toHaveProperty('password_hash');

    const { rows } = await db.query('SELECT password_hash FROM users WHERE email = $1', ['asha@example.com']);
    expect(rows[0].password_hash).not.toBe('secret123');
    expect(rows[0].password_hash).toMatch(/^\$2[aby]\$/); // bcrypt format
  });

  test('rejects a duplicate email (case-insensitive)', async () => {
    await createUser({ email: 'same@example.com' });
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Other', email: 'SAME@example.com', password: 'password123' })
      .expect(409);
    expect(res.body.error).toBe('An account with this email already exists.');
  });

  test.each([
    [{ email: 'a@b.co', password: 'password123' }, 'name'],
    [{ name: 'A', email: 'not-an-email', password: 'password123' }, 'email'],
    [{ name: 'A', email: 'a@b.co', password: 'short' }, 'password'],
  ])('validates signup fields %#', async (body, field) => {
    const res = await request(app).post('/api/auth/signup').send(body).expect(400);
    expect(res.body.field).toBe(field);
  });
});

describe('POST /api/auth/login', () => {
  test('logs in with correct credentials', async () => {
    await createUser({ email: 'login@example.com', password: 'password123' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'password123' })
      .expect(200);
    expect(res.body.token).toEqual(expect.any(String));
  });

  test('returns the same error for a wrong password and an unknown email', async () => {
    await createUser({ email: 'login@example.com', password: 'password123' });
    const wrong = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'nope-nope' })
      .expect(401);
    const unknown = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@example.com', password: 'password123' })
      .expect(401);
    expect(wrong.body.error).toBe('Invalid email or password.');
    expect(unknown.body.error).toBe(wrong.body.error);
  });
});

describe('protected routes', () => {
  test('reject requests without a token or with a bad token', async () => {
    await request(app).get('/api/readings').expect(401);
    await request(app).get('/api/readings').set('Authorization', 'Bearer garbage').expect(401);
  });
});
