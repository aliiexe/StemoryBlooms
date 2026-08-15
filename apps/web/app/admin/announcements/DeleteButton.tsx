'use client';

import { useState } from 'react';
import { deleteAnnouncement } from './actions';
import ConfirmModal from '../components/ConfirmModal';

export default function DeleteButton({ id }: { id: string }) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setShowConfirm(false);
    await deleteAnnouncement(id);
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        type="button"
        style={{
          padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500,
          background: '#FCE4EC', color: '#880E4F', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
        }}
      >
        Delete
      </button>

      <ConfirmModal
        isOpen={showConfirm}
        title="Delete Announcement"
        message="Are you sure you want to delete this announcement? This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
