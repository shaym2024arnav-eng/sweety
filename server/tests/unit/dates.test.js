const {
  isValidDateString,
  monthToDateRange,
  previousMonthRange,
  todayInTimezone,
} = require('../../src/utils/dates');

describe('report date ranges', () => {
  test('month-to-date runs from the 1st to the selected date (assignment example)', () => {
    expect(monthToDateRange('2026-10-15')).toEqual({ from: '2026-10-01', to: '2026-10-15' });
  });

  test('monthly is the whole previous month (assignment example)', () => {
    expect(previousMonthRange('2026-10-15')).toEqual({ from: '2026-09-01', to: '2026-09-30' });
  });

  test('previous month of January is December of the previous year', () => {
    expect(previousMonthRange('2026-01-10')).toEqual({ from: '2025-12-01', to: '2025-12-31' });
  });

  test('handles February in leap and non-leap years', () => {
    expect(previousMonthRange('2024-03-05').to).toBe('2024-02-29');
    expect(previousMonthRange('2026-03-31').to).toBe('2026-02-28');
  });
});

describe('isValidDateString', () => {
  test('accepts real dates and rejects impossible ones', () => {
    expect(isValidDateString('2024-02-29')).toBe(true);
    expect(isValidDateString('2026-02-29')).toBe(false);
    expect(isValidDateString('2026-13-01')).toBe(false);
    expect(isValidDateString(20261015)).toBe(false);
  });
});

describe('todayInTimezone', () => {
  test('uses the configured time zone, not UTC', () => {
    // 20:00 UTC on 15 Oct is already 01:30 on 16 Oct in India
    const instant = new Date('2026-10-15T20:00:00Z');
    expect(todayInTimezone('UTC', instant)).toBe('2026-10-15');
    expect(todayInTimezone('Asia/Kolkata', instant)).toBe('2026-10-16');
  });
});
