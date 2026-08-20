'use client';

import React from 'react';
import { markMessageRead, markMessageResolved } from './actions';
import styles from '../dashboard.module.css';
import { toast } from 'sonner';

export function MessageActions({ id, status }: { id: string, status: string }) {
  const handleRead = async () => {
    await markMessageRead(id);
    toast.success('Message marked as read');
  };

  const handleResolve = async () => {
    await markMessageResolved(id);
    toast.success('Message marked as resolved');
  };

  return (
    <div className={styles.actionRow}>
      {status === 'UNREAD' && (
        <button
          type="button"
          onClick={handleRead}
          className={styles.actionButton}
        >
          Mark Read
        </button>
      )}
      {status !== 'RESOLVED' && (
        <button
          type="button"
          onClick={handleResolve}
          className={styles.actionButtonSecondary}
        >
          Resolve
        </button>
      )}
    </div>
  );
}
