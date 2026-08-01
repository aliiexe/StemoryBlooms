import React from 'react';
import styles from './StatusBadge.module.css';

export interface StatusBadgeProps {
  status: 'NEW' | 'CONFIRMED' | 'IN_PRODUCTION' | 'READY_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalizedStatus = status.toLowerCase() as keyof typeof styles;
  const className = `${styles.badge} ${styles[normalizedStatus] || styles.default}`;
  
  return (
    <span className={className}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};
