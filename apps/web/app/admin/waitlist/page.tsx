import React from 'react';
import { prisma } from '@stemory/database';
import styles from '../dashboard.module.css';

export default async function AdminWaitlistPage() {
  const waitlist = await prisma.waitlistEntry.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className={styles.dashboard}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className={styles.shopTitle} style={{ fontSize: '1.75rem', margin: 0 }}>Waitlist Subscribers</h1>
      </header>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date Joined</th>
              <th>Email</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {waitlist.map((w) => (
              <tr key={w.id}>
                <td>{new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(w.createdAt))}</td>
                <td><strong>{w.email}</strong></td>
                <td>
                  <span className={styles.badge} style={{ backgroundColor: '#E8F5E9', color: '#1B5E20' }}>
                    Active
                  </span>
                </td>
              </tr>
            ))}
            {waitlist.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: '#7A7571' }}>No waitlist subscribers found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
