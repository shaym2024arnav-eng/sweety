import { useState } from 'react';
import { api } from '../api/client';
import Modal from './Modal';
import ReadingForm from './ReadingForm';

/**
 * Shared edit + delete behaviour for any list of readings.
 * Returns handlers for rows and the modal element to render.
 */
export function useReadingEditor(onChanged) {
  const [editing, setEditing] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const startEdit = (reading) => setEditing(reading);

  const remove = async (reading) => {
    const ok = window.confirm(`Delete the ${reading.slot_label} reading (${reading.value} mg/dl)?`);
    if (!ok) return;
    try {
      setDeleteError(null);
      await api.deleteReading(reading.id);
      onChanged();
    } catch (err) {
      setDeleteError(err.message);
    }
  };

  const modal = editing && (
    <Modal title="Edit reading" onClose={() => setEditing(null)}>
      <ReadingForm
        initial={editing}
        submitLabel="Save changes"
        onCancel={() => setEditing(null)}
        onSubmit={async (body) => {
          await api.updateReading(editing.id, body);
          setEditing(null);
          onChanged();
        }}
      />
    </Modal>
  );

  return { startEdit, remove, modal, deleteError };
}
