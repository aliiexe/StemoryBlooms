'use client';

import React, { useState } from 'react';
import { approveReview, rejectReview, deleteReview } from './actions';
import ConfirmModal from '../components/ConfirmModal';

export function ReviewActions({ id, status }: { id: string, status: string }) {
  const [showConfirm, setShowConfirm] = useState(false);

  const confirmDelete = async () => {
    setShowConfirm(false);
    await deleteReview(id);
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {status !== 'APPROVED' && (
          <button 
            onClick={() => approveReview(id)}
            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #D6CFE6', backgroundColor: '#E8F5E9', color: '#1B5E20', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            Approve
          </button>
        )}
        {status !== 'REJECTED' && (
          <button 
            onClick={() => rejectReview(id)}
            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #D6CFE6', backgroundColor: '#FFF3E0', color: '#E65100', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            Reject
          </button>
        )}
        <button 
          onClick={() => setShowConfirm(true)}
          style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', backgroundColor: '#FFEBEE', color: '#C62828', cursor: 'pointer', fontSize: '0.8rem' }}
        >
          Delete
        </button>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        title="Delete Review"
        message="Are you sure you want to delete this review? This action cannot be undone."
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
