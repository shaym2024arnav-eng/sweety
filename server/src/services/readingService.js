const db = require('../db');
const config = require('../config');
const { validateReadingInput } = require('./validation');
const { todayInTimezone } = require('../utils/dates');
const { SLOT_KEYS, MAX_READINGS_PER_DAY, slotLabel } = require('../utils/slots');
const { badRequest, conflict, notFound } = require('../utils/errors');

const UNIQUE_VIOLATION = '23505';

const COLUMNS = 'id, reading_date, slot, value, created_at, updated_at';

// Sort readings by date, then by the natural order of the slots in a day.
const SLOT_ORDER_SQL = `array_position(ARRAY['${SLOT_KEYS.join("','")}']::varchar[], slot)`;

const toDto = (row) => ({ ...row, slot_label: slotLabel(row.slot) });

// "an After lunch" but "a Morning (fasting)"
const withArticle = (label) => (/^[aeiou]/i.test(label) ? `an ${label}` : `a ${label}`);

const duplicateSlotMessage = (slot) =>
  `You already have ${withArticle(slotLabel(slot))} reading for this date.`;

/**
 * Enforces the per-day rules that need the database.
 * `excludeId` lets an edit ignore the reading being edited.
 */
async function assertDailyRules(userId, { reading_date: date, slot }, excludeId = null) {
  const { rows } = await db.query(
    `SELECT slot FROM readings
      WHERE user_id = $1 AND reading_date = $2 AND ($3::int IS NULL OR id <> $3)`,
    [userId, date, excludeId],
  );

  // Checked first so a full day always shows the "4 per day" message.
  if (rows.length >= MAX_READINGS_PER_DAY) {
    throw badRequest(`You can add only ${MAX_READINGS_PER_DAY} readings per day.`, 'reading_date');
  }
  if (rows.some((r) => r.slot === slot)) {
    throw conflict(duplicateSlotMessage(slot), 'slot');
  }
}

/** Turns a race-condition unique violation into the same friendly message. */
function rethrowUnique(err, slot) {
  if (err.code === UNIQUE_VIOLATION) throw conflict(duplicateSlotMessage(slot), 'slot');
  throw err;
}

async function createReading(userId, body) {
  const input = validateReadingInput(body, todayInTimezone(config.appTimezone));
  await assertDailyRules(userId, input);
  try {
    const { rows } = await db.query(
      `INSERT INTO readings (user_id, reading_date, slot, value)
       VALUES ($1, $2, $3, $4) RETURNING ${COLUMNS}`,
      [userId, input.reading_date, input.slot, input.value],
    );
    return toDto(rows[0]);
  } catch (err) {
    return rethrowUnique(err, input.slot);
  }
}

async function getReading(userId, id) {
  const { rows } = await db.query(
    `SELECT ${COLUMNS} FROM readings WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  // Another user's reading looks exactly like a missing one (no information leak).
  if (!rows[0]) throw notFound('Reading not found.');
  return toDto(rows[0]);
}

async function updateReading(userId, id, body) {
  await getReading(userId, id); // ownership check
  const input = validateReadingInput(body, todayInTimezone(config.appTimezone));
  await assertDailyRules(userId, input, id);
  try {
    const { rows } = await db.query(
      `UPDATE readings
          SET reading_date = $1, slot = $2, value = $3, updated_at = NOW()
        WHERE id = $4 AND user_id = $5
      RETURNING ${COLUMNS}`,
      [input.reading_date, input.slot, input.value, id, userId],
    );
    return toDto(rows[0]);
  } catch (err) {
    return rethrowUnique(err, input.slot);
  }
}

async function deleteReading(userId, id) {
  const { rowCount } = await db.query('DELETE FROM readings WHERE id = $1 AND user_id = $2', [
    id,
    userId,
  ]);
  if (rowCount === 0) throw notFound('Reading not found.');
}

/** Paginated list, newest first. Optional from/to date filters. */
async function listReadings(userId, { page, limit, from, to }) {
  const params = [userId];
  let where = 'user_id = $1';
  if (from) {
    params.push(from);
    where += ` AND reading_date >= $${params.length}`;
  }
  if (to) {
    params.push(to);
    where += ` AND reading_date <= $${params.length}`;
  }

  const countResult = await db.query(`SELECT COUNT(*)::int AS total FROM readings WHERE ${where}`, params);
  const total = countResult.rows[0].total;

  params.push(limit, (page - 1) * limit);
  const { rows } = await db.query(
    `SELECT ${COLUMNS} FROM readings WHERE ${where}
      ORDER BY reading_date DESC, ${SLOT_ORDER_SQL} DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );

  return {
    data: rows.map(toDto),
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

module.exports = {
  createReading,
  getReading,
  updateReading,
  deleteReading,
  listReadings,
  SLOT_ORDER_SQL,
  toDto,
};
