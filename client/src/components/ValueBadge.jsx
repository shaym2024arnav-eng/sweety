// Colour hint only. Thresholds are common reference points, not medical advice.
const level = (v) => (v < 70 ? 'low' : v > 180 ? 'high' : 'ok');

export default function ValueBadge({ value }) {
  return (
    <span className={`value value-${level(value)}`}>
      {value} <small>mg/dl</small>
    </span>
  );
}
