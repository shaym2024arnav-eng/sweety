// Date helpers that work on plain 'YYYY-MM-DD' strings.
// All arithmetic is done in UTC so the server's own time zone never shifts a date.

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const pad = (n) => String(n).padStart(2, '0');

/** True only for a real calendar date in YYYY-MM-DD form (rejects 2026-02-30). */
function isValidDateString(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** Today's date as 'YYYY-MM-DD' in the given IANA time zone. */
function todayInTimezone(timeZone, now = new Date()) {
  // en-CA formats dates as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** Plain string comparison works because the format is zero-padded and big-endian. */
const isAfter = (a, b) => a > b;

/** 1st of the month -> selected date. */
function monthToDateRange(dateStr) {
  const [y, m] = dateStr.split('-');
  return { from: `${y}-${m}-01`, to: dateStr };
}

/** The whole calendar month before the selected date's month. */
function previousMonthRange(dateStr) {
  const [y, m] = dateStr.split('-').map(Number);
  // Day 0 of the current month = last day of the previous month.
  const lastDayPrev = new Date(Date.UTC(y, m - 1, 0));
  const py = lastDayPrev.getUTCFullYear();
  const pm = pad(lastDayPrev.getUTCMonth() + 1);
  return { from: `${py}-${pm}-01`, to: `${py}-${pm}-${pad(lastDayPrev.getUTCDate())}` };
}

module.exports = {
  isValidDateString,
  todayInTimezone,
  isAfter,
  monthToDateRange,
  previousMonthRange,
};
