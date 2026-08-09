'use client';

import React, { useState } from 'react';
import { updateOrderStatus } from './actions';
import styles from '../dashboard.module.css';

export function OrderActions({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAction = async (nextStatus: string) => {
    setIsSubmitting(true);
    await updateOrderStatus(orderId, nextStatus);
    setStatus(nextStatus);
    setIsSubmitting(false);
  };

  return (
    <div className={styles.actionRow}>
      <select
        className={styles.actionSelect}
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        disabled={isSubmitting}
      >
        <option value="NEW">New</option>
        <option value="IN_PRODUCTION">In production</option>
        <option value="READY">Ready</option>
        <option value="COMPLETED">Completed</option>
        <option value="CANCELLED">Cancelled</option>
      </select>
      <button type="button" className={styles.actionButton} onClick={() => handleAction(status)} disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Update'}
      </button>
      {status !== 'CANCELLED' && (
        <button type="button" className={styles.actionButtonSecondary} onClick={() => handleAction('CANCELLED')} disabled={isSubmitting}>
          Cancel
        </button>
      )}
    </div>
  );
}
