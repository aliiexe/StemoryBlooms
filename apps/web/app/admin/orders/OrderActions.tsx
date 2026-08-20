'use client';

import React, { useState } from 'react';
import { updateOrderStatus, deleteOrder } from './actions';
import styles from '../dashboard.module.css';
import CustomDropdown from '../components/CustomDropdown';
import ConfirmModal from '../components/ConfirmModal';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function OrderActions({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  // If the status is somehow DELIVERED but we don't have it in our standard list, ensure we handle it
  const initialStatus = currentStatus === 'DELIVERED' ? 'COMPLETED' : currentStatus;
  const [status, setStatus] = useState(initialStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const router = useRouter();

  const handleAction = async (nextStatus: string) => {
    setIsSubmitting(true);
    await updateOrderStatus(orderId, nextStatus);
    setStatus(nextStatus);
    toast.success(`Order status updated to ${nextStatus}`);
    setIsSubmitting(false);
  };

  const confirmDelete = async () => {
    setShowConfirmDelete(false);
    setIsSubmitting(true);
    await deleteOrder(orderId);
    toast.success('Order deleted');
    setIsSubmitting(false);
    router.push('/admin/orders');
  };

  return (
    <>
      <div className={styles.actionRow}>
        <div style={{ width: '180px' }}>
          <CustomDropdown
            value={status}
            onChange={setStatus}
            options={[
              { value: 'NEW', label: 'New' },
              { value: 'IN_PRODUCTION', label: 'In production' },
              { value: 'READY', label: 'Ready' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'DELIVERED', label: 'Delivered' },
              { value: 'CANCELLED', label: 'Cancelled' }
            ]}
          />
        </div>
        <button type="button" className={styles.actionButton} onClick={() => handleAction(status)} disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Update'}
        </button>
        {status !== 'CANCELLED' && (
          <button type="button" className={styles.actionButtonSecondary} onClick={() => handleAction('CANCELLED')} disabled={isSubmitting}>
            Cancel
          </button>
        )}
        <button 
          type="button" 
          onClick={() => setShowConfirmDelete(true)} 
          disabled={isSubmitting}
          style={{ padding: '0.5rem 1rem', border: '1px solid #FFEBEE', backgroundColor: '#FFEBEE', color: '#C62828', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}
        >
          Delete Order
        </button>
      </div>

      <ConfirmModal
        isOpen={showConfirmDelete}
        title="Delete Order"
        message="Are you sure you want to delete this order? All related items will be deleted and this action cannot be undone."
        confirmText="Delete Order"
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirmDelete(false)}
      />
    </>
  );
}
