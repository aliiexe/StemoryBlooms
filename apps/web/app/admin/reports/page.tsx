import React from 'react';
import { PrismaClient } from '@stemory/database';
import styles from '../dashboard.module.css';

const prisma = new PrismaClient();

export default async function AdminReportsPage() {
  const events = await prisma.analyticsEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  return (
    <div className={styles.dashboard}>
      <header className={styles.shopHeader} style={{ padding: '0', marginBottom: '2rem' }}>
        <h1 className={styles.shopTitle} style={{ fontSize: '1.75rem' }}>Analytics Reports</h1>
      </header>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Recent Events (Last 50)</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Event</th>
              <th>User ID</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id}>
                <td>{e.event}</td>
                <td>{e.userId || 'Anonymous'}</td>
                <td>{new Date(e.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: '#7A7571' }}>No analytics events tracked yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
