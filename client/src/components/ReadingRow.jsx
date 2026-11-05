import ValueBadge from './ValueBadge';
import { formatDate } from '../utils/dates';

export default function ReadingRow({ reading, showDate = false, onEdit, onDelete }) {
  return (
    <li className="reading-row">
      <div className="reading-meta">
        <span className="slot">{reading.slot_label}</span>
        {showDate && <span className="muted">{formatDate(reading.reading_date)}</span>}
      </div>
      <ValueBadge value={reading.value} />
      <div className="row-actions">
        <button type="button" className="btn btn-small" onClick={() => onEdit(reading)}>
          Edit
        </button>
        <button type="button" className="btn btn-small btn-danger" onClick={() => onDelete(reading)}>
          Delete
        </button>
      </div>
    </li>
  );
}
