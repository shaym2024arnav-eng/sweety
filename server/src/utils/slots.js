// The four daily time slots, in the order they happen during the day.
const SLOTS = [
  { key: 'morning_fasting', label: 'Morning (fasting)' },
  { key: 'after_breakfast', label: 'After breakfast' },
  { key: 'after_lunch', label: 'After lunch' },
  { key: 'after_dinner', label: 'After dinner' },
];

const SLOT_KEYS = SLOTS.map((s) => s.key);
const MAX_READINGS_PER_DAY = 4;

const slotLabel = (key) => SLOTS.find((s) => s.key === key)?.label ?? key;

module.exports = { SLOTS, SLOT_KEYS, MAX_READINGS_PER_DAY, slotLabel };
