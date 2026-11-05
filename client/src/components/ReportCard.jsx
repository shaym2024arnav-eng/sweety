import { formatRange } from '../utils/dates';

/** Highest / lowest / average / count for one date range, or a friendly empty state. */
export default function ReportCard({ title, report, children }) {
  const empty = !report || report.count === 0;
  return (
    <section className="card report-card" aria-label={`${title} report`}>
      <header className="card-header">
        <h2>{title}</h2>
        {report && <span className="muted">{formatRange(report.from, report.to)}</span>}
      </header>

      {empty ? (
        <div className="empty-state">
          <p>No readings for this period yet.</p>
          <p className="muted">Add a reading and your summary will appear here.</p>
        </div>
      ) : (
        <dl className="stats">
          <div>
            <dt>Highest</dt>
            <dd>{report.highest}</dd>
          </div>
          <div>
            <dt>Lowest</dt>
            <dd>{report.lowest}</dd>
          </div>
          <div>
            <dt>Average</dt>
            <dd>{report.average.toFixed(1)}</dd>
          </div>
          <div>
            <dt>Readings</dt>
            <dd>{report.count}</dd>
          </div>
        </dl>
      )}
      {children}
    </section>
  );
}
