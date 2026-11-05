import { MIN_VALUE, MAX_VALUE } from './constants';

/**
 * Client-side checks that give instant feedback. The server repeats every check
 * (and also enforces the per-day rules, which need the database).
 * Returns an error message, or null when the form is OK to submit.
 */
export function validateReadingForm({ value, reading_date: date, slot }, today) {
  const text = String(value ?? '').trim();
  if (text === '') return 'Please enter a glucose value.';
  if (!/^\d+$/.test(text) || Number(text) < MIN_VALUE || Number(text) > MAX_VALUE) {
    return `Value must be between ${MIN_VALUE} and ${MAX_VALUE} mg/dl.`;
  }
  if (!date) return 'Please choose a date.';
  if (date > today) return 'Date cannot be in the future.';
  if (!slot) return 'Please choose a time slot.';
  return null;
}
