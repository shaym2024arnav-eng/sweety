const { parseGlucoseValue, validateReadingInput, MESSAGES } = require('../../src/services/validation');

const TODAY = '2026-10-15';
const valid = { reading_date: '2026-10-15', slot: 'after_lunch', value: 120 };

const errorOf = (fn) => {
  try {
    fn();
  } catch (err) {
    return err;
  }
  throw new Error('Expected function to throw');
};

describe('parseGlucoseValue', () => {
  test.each([undefined, null, '', '   '])('rejects missing value %p', (raw) => {
    expect(errorOf(() => parseGlucoseValue(raw)).message).toBe(MESSAGES.valueRequired);
  });

  test.each([39, 601, '120.5', 120.5, 'abc', '-50', '1e2', '12abc'])(
    'rejects out-of-range or non-whole value %p',
    (raw) => {
      expect(errorOf(() => parseGlucoseValue(raw)).message).toBe(MESSAGES.valueRange);
    },
  );

  test.each([
    [40, 40],
    [600, 600],
    ['120', 120],
    [' 95 ', 95],
  ])('accepts %p as %p', (raw, expected) => {
    expect(parseGlucoseValue(raw)).toBe(expected);
  });
});

describe('validateReadingInput', () => {
  test('returns the cleaned reading when everything is valid', () => {
    expect(validateReadingInput({ ...valid, value: '120' }, TODAY)).toEqual(valid);
  });

  test('allows today but rejects tomorrow', () => {
    expect(() => validateReadingInput(valid, TODAY)).not.toThrow();
    const err = errorOf(() => validateReadingInput({ ...valid, reading_date: '2026-10-16' }, TODAY));
    expect(err.message).toBe('Date cannot be in the future.');
  });

  test.each(['2026-02-30', '15-10-2026', '2026/10/15', 'tomorrow'])('rejects invalid date %p', (d) => {
    const err = errorOf(() => validateReadingInput({ ...valid, reading_date: d }, TODAY));
    expect(err.message).toBe(MESSAGES.dateInvalid);
  });

  test('rejects an unknown slot', () => {
    const err = errorOf(() => validateReadingInput({ ...valid, slot: 'midnight_snack' }, TODAY));
    expect(err.field).toBe('slot');
  });
});
