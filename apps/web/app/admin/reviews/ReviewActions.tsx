'use client';

import React, { useState } from 'react';
import { approveReview, rejectReview, deleteReview } from './actions';
import ConfirmModal from '../components/ConfirmModal';
import { toast } from 'sonner';

export function ReviewActions({ id, status }: { id: string, status: string }) {
  const [showConfirm, setShowConfirm] = useState(false);

  const confirmDelete = async () => {
    setShowConfirm(false);
    const res = await deleteReview(id);
    if (res?.error) toast.error(res.error);
    else toast.success('Review deleted');
  };

  const handleApprove = async () => {
    const res = await approveReview(id);
    if (res?.error) toast.error(res.error);
    else toast.success('Review approved');
  };

  const handleReject = async () => {
    const res = await rejectReview(id);
    if (res?.error) toast.error(res.error);
    else toast.success('Review rejected');
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {status !== 'APPROVED' && (
          <button 
            onClick={handleApprove}
            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #D6CFE6', backgroundColor: '#E8F5E9', color: '#1B5E20', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            Approve
          </button>
        )}
        {status !== 'REJECTED' && (
          <button 
            onClick={handleReject}
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
