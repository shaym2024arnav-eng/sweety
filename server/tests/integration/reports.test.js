const { app, db, request, resetDb, createUser, addReading } = require('../helpers');

let auth;

beforeEach(async () => {
  await resetDb();
  ({ auth } = await createUser());
});
afterAll(() => db.pool.end());

const getReport = (path) => request(app).get(path).set('Authorization', auth).expect(200);

describe('reports', () => {
  beforeEach(async () => {
    const readings = [
      // previous month (September) — only these count for the "monthly" report
      ['2026-09-01', 'morning_fasting', 100],
      ['2026-09-30', 'after_dinner', 200],
      // selected day, added out of order to check slot ordering
      ['2026-10-15', 'after_lunch', 150],
      ['2026-10-15', 'morning_fasting', 95],
      ['2026-10-15', 'after_breakfast', 141],
      // earlier in October — counts for month-to-date only
      ['2026-10-01', 'after_lunch', 210],
      // after the selected date — must not count in month-to-date
      ['2026-10-16', 'after_lunch', 590],
    ];
    for (const [reading_date, slot, value] of readings) {
      await addReading(auth, { reading_date, slot, value }).expect(201);
    }
  });

  test('daily report: stats for one day and each reading listed in slot order', async () => {
    const { body } = await getReport('/api/reports/daily?date=2026-10-15');
    expect(body).toMatchObject({ from: '2026-10-15', to: '2026-10-15', count: 3, highest: 150, lowest: 95 });
    expect(body.average).toBe(128.7); // (150 + 95 + 141) / 3 = 128.666… → 128.7
    expect(body.readings.map((r) => r.slot_label)).toEqual([
      'Morning (fasting)',
      'After breakfast',
      'After lunch',
    ]);
  });

  test('month-to-date report: 1st of the month up to and including the selected date', async () => {
    const { body } = await getReport('/api/reports/month-to-date?date=2026-10-15');
    expect(body).toMatchObject({
      from: '2026-10-01',
      to: '2026-10-15',
      count: 4,
      highest: 210,
      lowest: 95,
      average: 149, // (150 + 95 + 141 + 210) / 4
    });
  });

  test('monthly report: the whole previous month', async () => {
    const { body } = await getReport('/api/reports/monthly?date=2026-10-15');
    expect(body).toMatchObject({
      from: '2026-09-01',
      to: '2026-09-30',
      count: 2,
      highest: 200,
      lowest: 100,
      average: 150,
    });
  });

  test('combined endpoint returns all three reports', async () => {
    const { body } = await getReport('/api/reports?date=2026-10-15');
    expect(body.daily.count).toBe(3);
    expect(body.monthToDate.count).toBe(4);
    expect(body.monthly.count).toBe(2);
  });

  test('empty range returns zero count and null stats (UI shows the empty state)', async () => {
    const { body } = await getReport('/api/reports/daily?date=2026-08-10');
    expect(body).toMatchObject({ count: 0, highest: null, lowest: null, average: null, readings: [] });
  });

  test('reports only include the logged-in user’s readings', async () => {
    const other = await createUser();
    const res = await request(app)
      .get('/api/reports/daily?date=2026-10-15')
      .set('Authorization', other.auth)
      .expect(200);
    expect(res.body.count).toBe(0);
  });

  test('rejects a missing or invalid date', async () => {
    await request(app).get('/api/reports/daily').set('Authorization', auth).expect(400);
    await request(app).get('/api/reports/daily?date=2026-02-31').set('Authorization', auth).expect(400);
  });
});
