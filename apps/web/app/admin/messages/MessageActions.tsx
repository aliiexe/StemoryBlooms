'use client';

import React from 'react';
import { markMessageRead, markMessageResolved } from './actions';
import styles from '../dashboard.module.css';

export function MessageActions({ id, status }: { id: string, status: string }) {
  return (
    <div className={styles.actionRow}>
      {status === 'UNREAD' && (
        <button
          type="button"
          onClick={() => markMessageRead(id)}
          className={styles.actionButton}
        >
          Mark Read
        </button>
      )}
      {status !== 'RESOLVED' && (
        <button
          type="button"
          onClick={() => markMessageResolved(id)}
          className={styles.actionButtonSecondary}
        >
          Resolve
        </button>
      )}
    </div>
  );
}
