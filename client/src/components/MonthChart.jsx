import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SLOTS } from '../utils/constants';
import { formatRange } from '../utils/dates';

const COLORS = {
  morning_fasting: '#2a78d6',
  after_breakfast: '#eb8a2f',
  after_lunch: '#2c9c6a',
  after_dinner: '#9a4fd1',
};

/** Pivot [{reading_date, slot, value}] into one row per day with a column per slot. */
function toRows(points) {
  const byDay = new Map();
  for (const p of points) {
    const row = byDay.get(p.reading_date) ?? { day: Number(p.reading_date.slice(8)) };
    row[p.slot] = p.value;
    byDay.set(p.reading_date, row);
  }
  return [...byDay.values()];
}

export default function MonthChart({ chart }) {
  if (!chart) return null;
  const rows = toRows(chart.points);

  return (
    <section className="card" aria-label="Month chart">
      <header className="card-header">
        <h2>This month</h2>
        <span className="muted">{formatRange(chart.from, chart.to)}</span>
      </header>
      {rows.length === 0 ? (
        <div className="empty-state">
          <p>No readings this month yet.</p>
        </div>
      ) : (
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={rows} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="var(--grid)" vertical={false} />
              {/* Shaded 70–180 band: a common target range */}
              <ReferenceArea y1={70} y2={180} fill="var(--ok-bg)" fillOpacity={0.6} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis domain={[0, 'auto']} tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip
                labelFormatter={(d) => `Day ${d}`}
                formatter={(v, key) => [`${v} mg/dl`, SLOTS.find((s) => s.key === key)?.label]}
              />
              <Legend formatter={(key) => SLOTS.find((s) => s.key === key)?.label} />
              {SLOTS.map((s) => (
                <Line
                  key={s.key}
                  dataKey={s.key}
                  stroke={COLORS[s.key]}
                  strokeWidth={2}
                  dot={{ r: 2.5 }}
                  connectNulls
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
