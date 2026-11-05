import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import ReadingForm from '../components/ReadingForm';
import ReadingRow from '../components/ReadingRow';
import ReportCard from '../components/ReportCard';
import MonthChart from '../components/MonthChart';
import { useReadingEditor } from '../components/useReadingEditor';
import { formatDate, todayLocal } from '../utils/dates';

export default function DashboardPage() {
  const today = todayLocal();
  const [date, setDate] = useState(today);
  const [reports, setReports] = useState(null);
  const [chart, setChart] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [r, c] = await Promise.all([api.reports(date), api.chart(date)]);
      setReports(r);
      setChart(c);
    } catch (err) {
      setError(err.message);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  const { startEdit, remove, modal, deleteError } = useReadingEditor(load);

  const handleAdd = async (body) => {
    const created = await api.createReading(body);
    setNotice(`Saved ${created.slot_label} reading for ${formatDate(created.reading_date)}.`);
    // Jump the reports to the day the reading was added for
    if (created.reading_date !== date) setDate(created.reading_date);
    else load();
  };

  return (
    <div className="dashboard">
      <div className="toolbar">
        <div className="field inline">
          <label htmlFor="report-date">Report date</label>
          <input
            id="report-date"
            type="date"
            max={today}
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
          />
        </div>
        {date !== today && (
          <button type="button" className="btn btn-ghost" onClick={() => setDate(today)}>
            Back to today
          </button>
        )}
      </div>

      {error && (
        <p className="banner banner-error" role="alert">
          {error}
        </p>
      )}

      <div className="grid">
        <section className="card add-card" aria-label="Add a reading">
          <header className="card-header">
            <h2>Add a reading</h2>
          </header>
          {/* key resets the form's default date when the report date changes */}
          <ReadingForm key={date} defaultDate={date} today={today} onSubmit={handleAdd} />
          {notice && (
            <p className="banner banner-ok" role="status">
              {notice}
            </p>
          )}
        </section>

        <ReportCard title="Daily" report={reports?.daily}>
          {reports?.daily.readings.length > 0 && (
            <ul className="reading-list" aria-label="Readings for the day">
              {reports.daily.readings.map((r) => (
                <ReadingRow key={r.id} reading={r} onEdit={startEdit} onDelete={remove} />
              ))}
            </ul>
          )}
          {deleteError && <p className="form-error">{deleteError}</p>}
        </ReportCard>

        <ReportCard title="Month to date" report={reports?.monthToDate} />
        <ReportCard title="Previous month" report={reports?.monthly} />
      </div>

      <MonthChart chart={chart} />
      {modal}
    </div>
  );
}
