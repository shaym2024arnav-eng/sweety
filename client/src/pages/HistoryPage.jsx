import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import ReadingRow from '../components/ReadingRow';
import { useReadingEditor } from '../components/useReadingEditor';

const PAGE_SIZE = 20;

export default function HistoryPage() {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await api.listReadings({ page, limit: PAGE_SIZE });
      // If the last item on a page was deleted, step back a page
      if (res.data.length === 0 && page > 1) setPage(page - 1);
      else setResult(res);
    } catch (err) {
      setError(err.message);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const { startEdit, remove, modal, deleteError } = useReadingEditor(load);
  const pagination = result?.pagination;

  return (
    <section className="card">
      <header className="card-header">
        <h2>All readings</h2>
        {pagination && <span className="muted">{pagination.total} total</span>}
      </header>

      {error && <p className="banner banner-error">{error}</p>}
      {deleteError && <p className="form-error">{deleteError}</p>}

      {result && result.data.length === 0 ? (
        <div className="empty-state">
          <p>You haven't added any readings yet.</p>
        </div>
      ) : (
        <ul className="reading-list">
          {result?.data.map((r) => (
            <ReadingRow key={r.id} reading={r} showDate onEdit={startEdit} onDelete={remove} />
          ))}
        </ul>
      )}

      {pagination && pagination.totalPages > 1 && (
        <nav className="pager" aria-label="Pagination">
          <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            ← Newer
          </button>
          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            className="btn btn-ghost"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Older →
          </button>
        </nav>
      )}
      {modal}
    </section>
  );
}
