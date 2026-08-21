'use client';

import React, { useState } from 'react';
import { updateOrderStatus, deleteOrder, pushOrderToInfinidis } from './actions';
import styles from '../dashboard.module.css';
import CustomDropdown from '../components/CustomDropdown';
import ConfirmModal from '../components/ConfirmModal';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Truck } from 'lucide-react';

export function OrderActions({ orderId, currentStatus, sentToInfinidis }: { orderId: string; currentStatus: string; sentToInfinidis: boolean }) {
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

  const handlePushInfinidis = async () => {
    setIsSubmitting(true);
    const res = await pushOrderToInfinidis(orderId);
    if (res.success) {
      toast.success('Order successfully sent to Infinidis');
    } else {
      toast.error(res.error || 'Failed to send to Infinidis');
    }
    setIsSubmitting(false);
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
        
        {sentToInfinidis ? (
          <button type="button" disabled style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#FDFBF7', border: '1px solid #D6CFE6', color: 'var(--brand-primary)', borderRadius: '4px', fontSize: '0.9rem', fontWeight: 500, opacity: 0.8 }}>
            <Truck size={14} /> Sent to Delivery ✓
          </button>
        ) : (
          <button type="button" onClick={handlePushInfinidis} disabled={isSubmitting || status === 'CANCELLED'} style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#fff', border: '1px solid #D6CFE6', color: '#5A5551', borderRadius: '4px', cursor: (isSubmitting || status === 'CANCELLED') ? 'not-allowed' : 'pointer', fontSize: '0.9rem', fontWeight: 500 }}>
            <Truck size={14} /> Send to Delivery
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
