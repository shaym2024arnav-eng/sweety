export const SLOTS = [
  { key: 'morning_fasting', label: 'Morning (fasting)' },
  { key: 'after_breakfast', label: 'After breakfast' },
  { key: 'after_lunch', label: 'After lunch' },
  { key: 'after_dinner', label: 'After dinner' },
];

export const slotLabel = (key) => SLOTS.find((s) => s.key === key)?.label ?? key;

export const MIN_VALUE = 40;
export const MAX_VALUE = 600;
