import { useState } from 'react';
import { SLOTS } from '../utils/constants';
import { todayLocal } from '../utils/dates';
import { validateReadingForm } from '../utils/validation';

const emptyForm = (date) => ({ reading_date: date, slot: SLOTS[0].key, value: '' });

/**
 * Add / edit form for a reading.
 * `onSubmit` receives { reading_date, slot, value } and may throw an ApiError;
 * its message is shown to the user.
 */
export default function ReadingForm({
  initial,
  defaultDate,
  onSubmit,
  onCancel,
  submitLabel = 'Add reading',
  today = todayLocal(),
}) {
  const [form, setForm] = useState(() =>
    initial
      ? { reading_date: initial.reading_date, slot: initial.slot, value: String(initial.value) }
      : emptyForm(defaultDate || today),
  );
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const message = validateReadingForm(form, today);
    if (message) {
      setError(message);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ ...form, value: Number(form.value) });
      // After adding, clear the value but keep date/slot handy for the next entry
      if (!initial) setForm((f) => ({ ...f, value: '' }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="reading-form" onSubmit={handleSubmit} noValidate aria-label="Reading form">
      <div className="field">
        <label htmlFor="reading-date">Date</label>
        <input
          id="reading-date"
          type="date"
          max={today}
          value={form.reading_date}
          onChange={update('reading_date')}
        />
      </div>

      <div className="field">
        <label htmlFor="reading-slot">Time slot</label>
        <select id="reading-slot" value={form.slot} onChange={update('slot')}>
          {SLOTS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="reading-value">Glucose (mg/dl)</label>
        <input
          id="reading-value"
          type="number"
          inputMode="numeric"
          step="1"
          placeholder="e.g. 110"
          value={form.value}
          onChange={update('value')}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'reading-error' : undefined}
        />
      </div>

      {error && (
        <p id="reading-error" className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
