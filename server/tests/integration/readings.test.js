const { app, db, request, resetDb, createUser, addReading } = require('../helpers');
const { todayInTimezone } = require('../../src/utils/dates');

const DATE = '2026-10-15';
let auth;

beforeEach(async () => {
  await resetDb();
  ({ auth } = await createUser());
});
afterAll(() => db.pool.end());

const fillDay = async (date = DATE) => {
  for (const slot of ['morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner']) {
    await addReading(auth, { reading_date: date, slot, value: 110 }).expect(201);
  }
};

describe('creating readings', () => {
  test('creates a reading and returns it with a readable slot label', async () => {
    const res = await addReading(auth, { reading_date: DATE, slot: 'after_lunch', value: '145' }).expect(201);
    expect(res.body).toMatchObject({
      reading_date: DATE,
      slot: 'after_lunch',
      slot_label: 'After lunch',
      value: 145,
    });
  });

  // One test per rule from the assignment, checking the exact message the UI shows.
  test.each([
    [{ value: '' }, 'Please enter a glucose value.'],
    [{ value: 39 }, 'Value must be between 40 and 600 mg/dl.'],
    [{ value: 601 }, 'Value must be between 40 and 600 mg/dl.'],
    [{ value: 120.5 }, 'Value must be between 40 and 600 mg/dl.'],
  ])('rejects invalid value %p', async (override, message) => {
    const res = await addReading(auth, { reading_date: DATE, slot: 'after_lunch', value: 100, ...override });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe(message);
  });

  test('rejects a second reading in the same slot on the same day', async () => {
    await addReading(auth, { reading_date: DATE, slot: 'after_lunch', value: 120 }).expect(201);
    const res = await addReading(auth, { reading_date: DATE, slot: 'after_lunch', value: 130 }).expect(409);
    expect(res.body.error).toBe('You already have an After lunch reading for this date.');
  });

  test('the same slot is fine on a different day', async () => {
    await addReading(auth, { reading_date: DATE, slot: 'after_lunch', value: 120 }).expect(201);
    await addReading(auth, { reading_date: '2026-10-14', slot: 'after_lunch', value: 120 }).expect(201);
  });

  test('rejects a 5th reading on a full day', async () => {
    await fillDay();
    const res = await addReading(auth, { reading_date: DATE, slot: 'after_lunch', value: 130 }).expect(400);
    expect(res.body.error).toBe('You can add only 4 readings per day.');
  });

  test('rejects a date in the future', async () => {
    const today = todayInTimezone(process.env.APP_TIMEZONE);
    const tomorrow = new Date(`${today}T00:00:00Z`);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const res = await addReading(auth, {
      reading_date: tomorrow.toISOString().slice(0, 10),
      slot: 'after_lunch',
      value: 120,
    }).expect(400);
    expect(res.body.error).toBe('Date cannot be in the future.');

    // ...while today itself is allowed
    await addReading(auth, { reading_date: today, slot: 'after_lunch', value: 120 }).expect(201);
  });
});

describe('editing and deleting readings', () => {
  test('updates a reading, keeping its own slot without a false "duplicate" error', async () => {
    const { body } = await addReading(auth, { reading_date: DATE, slot: 'after_lunch', value: 120 });
    const res = await request(app)
      .put(`/api/readings/${body.id}`)
      .set('Authorization', auth)
      .send({ reading_date: DATE, slot: 'after_lunch', value: 180 })
      .expect(200);
    expect(res.body.value).toBe(180);
  });

  test('editing a reading on a full day is allowed (it does not count itself)', async () => {
    await fillDay();
    const { body } = await request(app).get('/api/readings').set('Authorization', auth);
    await request(app)
      .put(`/api/readings/${body.data[0].id}`)
      .set('Authorization', auth)
      .send({ reading_date: DATE, slot: body.data[0].slot, value: 200 })
      .expect(200);
  });

  test('cannot move a reading into a slot that is already taken', async () => {
    await addReading(auth, { reading_date: DATE, slot: 'after_lunch', value: 120 });
    const { body } = await addReading(auth, { reading_date: DATE, slot: 'after_dinner', value: 140 });
    const res = await request(app)
      .put(`/api/readings/${body.id}`)
      .set('Authorization', auth)
      .send({ reading_date: DATE, slot: 'after_lunch', value: 140 })
      .expect(409);
    expect(res.body.error).toBe('You already have an After lunch reading for this date.');
  });

  test('deletes a reading', async () => {
    const { body } = await addReading(auth, { reading_date: DATE, slot: 'after_lunch', value: 120 });
    await request(app).delete(`/api/readings/${body.id}`).set('Authorization', auth).expect(204);
    await request(app).get(`/api/readings/${body.id}`).set('Authorization', auth).expect(404);
  });
});

describe('data isolation between users', () => {
  test("a user cannot see, edit or delete someone else's readings", async () => {
    const { body: reading } = await addReading(auth, { reading_date: DATE, slot: 'after_lunch', value: 120 });
    const other = await createUser();

    const list = await request(app).get('/api/readings').set('Authorization', other.auth).expect(200);
    expect(list.body.data).toHaveLength(0);

    await request(app).get(`/api/readings/${reading.id}`).set('Authorization', other.auth).expect(404);
    await request(app)
      .put(`/api/readings/${reading.id}`)
      .set('Authorization', other.auth)
      .send({ reading_date: DATE, slot: 'after_lunch', value: 300 })
      .expect(404);
    await request(app).delete(`/api/readings/${reading.id}`).set('Authorization', other.auth).expect(404);

    // ...and the owner's reading is untouched
    const mine = await request(app).get(`/api/readings/${reading.id}`).set('Authorization', auth).expect(200);
    expect(mine.body.value).toBe(120);
  });
});

describe('pagination', () => {
  test('pages through readings, newest first', async () => {
    await fillDay('2026-10-14');
    await fillDay('2026-10-15');

    const res = await request(app).get('/api/readings?page=2&limit=3').set('Authorization', auth).expect(200);
    expect(res.body.pagination).toEqual({ page: 2, limit: 3, total: 8, totalPages: 3 });
    expect(res.body.data).toHaveLength(3);

    const first = await request(app).get('/api/readings?limit=1').set('Authorization', auth);
    expect(first.body.data[0]).toMatchObject({ reading_date: '2026-10-15', slot: 'after_dinner' });
  });

  test('rejects an invalid page number', async () => {
    await request(app).get('/api/readings?page=0').set('Authorization', auth).expect(400);
  });
});
