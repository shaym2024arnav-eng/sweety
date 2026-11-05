const db = require('../db');
const { SLOT_ORDER_SQL, toDto } = require('./readingService');
const { monthToDateRange, previousMonthRange } = require('../utils/dates');

/** Highest, lowest, average (1 decimal) and count for a date range. */
async function summarize(userId, from, to) {
  const { rows } = await db.query(
    `SELECT MAX(value)::int               AS highest,
            MIN(value)::int               AS lowest,
            ROUND(AVG(value)::numeric, 1) AS average,
            COUNT(*)::int                 AS count
       FROM readings
      WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3`,
    [userId, from, to],
  );
  const r = rows[0];
  return {
    from,
    to,
    count: r.count,
    highest: r.highest,
    lowest: r.lowest,
    // pg returns NUMERIC as a string to avoid precision loss; 1 decimal fits a JS number safely
    average: r.average === null ? null : Number(r.average),
  };
}

async function dailyReport(userId, date) {
  const summary = await summarize(userId, date, date);
  const { rows } = await db.query(
    `SELECT id, reading_date, slot, value, created_at, updated_at
       FROM readings WHERE user_id = $1 AND reading_date = $2
      ORDER BY ${SLOT_ORDER_SQL}`,
    [userId, date],
  );
  return { type: 'daily', ...summary, readings: rows.map(toDto) };
}

async function monthToDateReport(userId, date) {
  const { from, to } = monthToDateRange(date);
  return { type: 'month-to-date', ...(await summarize(userId, from, to)) };
}

async function monthlyReport(userId, date) {
  const { from, to } = previousMonthRange(date);
  return { type: 'monthly', ...(await summarize(userId, from, to)) };
}

/** Daily values for a chart: one point per reading in the selected date's month-to-date range. */
async function chartData(userId, date) {
  const { from, to } = monthToDateRange(date);
  const { rows } = await db.query(
    `SELECT reading_date, slot, value FROM readings
      WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3
      ORDER BY reading_date, ${SLOT_ORDER_SQL}`,
    [userId, from, to],
  );
  return { from, to, points: rows.map(toDto) };
}

module.exports = { dailyReport, monthToDateReport, monthlyReport, chartData };
