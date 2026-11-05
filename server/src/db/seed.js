/**
 * Creates (or resets) a demo user with realistic sample readings covering
 * the whole previous month and the current month up to today.
 *
 *   npm run seed
 *   Email:    demo@sweety.app
 *   Password: Demo@1234
 */
const bcrypt = require('bcrypt');
const db = require('./index');
const migrate = require('./migrate');
const config = require('../config');
const { todayInTimezone, previousMonthRange } = require('../utils/dates');
const { SLOT_KEYS } = require('../utils/slots');

const DEMO = { name: 'Demo Patient', email: 'demo@sweety.app', password: 'Demo@1234' };

// Small deterministic random generator so every seed run produces the same data.
function mulberry32(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Typical ranges (mg/dl) per slot for someone managing type 2 diabetes.
const RANGES = {
  morning_fasting: [88, 145],
  after_breakfast: [130, 215],
  after_lunch: [125, 230],
  after_dinner: [120, 205],
};

function* datesBetween(from, to) {
  const d = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  while (d <= end) {
    yield d.toISOString().slice(0, 10);
    d.setUTCDate(d.getUTCDate() + 1);
  }
}

async function seed() {
  await migrate();
  const rand = mulberry32(42);
  const today = todayInTimezone(config.appTimezone);
  const { from } = previousMonthRange(today);

  const hash = await bcrypt.hash(DEMO.password, config.bcryptRounds);
  // Deleting the user cascades to their readings, so re-running the seed is safe.
  await db.query('DELETE FROM users WHERE email = $1', [DEMO.email]);
  const { rows } = await db.query(
    'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
    [DEMO.name, DEMO.email, hash],
  );
  const userId = rows[0].id;

  const values = [];
  for (const date of datesBetween(from, today)) {
    for (const slot of SLOT_KEYS) {
      // Skip ~15% of readings so some days are incomplete (more realistic, and
      // useful for testing the "fewer than 4 readings" states).
      if (rand() < 0.15) continue;
      // Leave today's evening slot free so the reviewer can try adding a reading.
      if (date === today && slot === 'after_dinner') continue;
      const [min, max] = RANGES[slot];
      let value = Math.round(min + rand() * (max - min));
      if (rand() < 0.04) value = Math.round(240 + rand() * 80); // occasional spike
      values.push([userId, date, slot, value]);
    }
  }

  const placeholders = values
    .map((_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`)
    .join(', ');
  await db.query(
    `INSERT INTO readings (user_id, reading_date, slot, value) VALUES ${placeholders}`,
    values.flat(),
  );

  console.log(`Seeded ${values.length} readings from ${from} to ${today}.`);
  console.log(`Log in with ${DEMO.email} / ${DEMO.password}`);
}

seed()
  .then(() => db.pool.end())
  .catch((err) => {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  });
