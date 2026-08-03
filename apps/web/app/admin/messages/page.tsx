import React from 'react';
import { prisma } from '@stemory/database';
import styles from '../dashboard.module.css';
import { MessageActions } from './MessageActions';

export default async function AdminMessagesPage() {
  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className={styles.dashboard}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className={styles.shopTitle} style={{ fontSize: '1.75rem', margin: 0 }}>Support Messages</h1>
      </header>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Subject</th>
              <th>Message</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((m) => (
              <tr key={m.id}>
                <td style={{ whiteSpace: 'nowrap' }}>
                  {new Intl.DateTimeFormat('en-US', { dateStyle: 'short' }).format(new Date(m.createdAt))}
                </td>
                <td>
                  <strong>{m.firstName} {m.lastName}</strong><br />
                  <a href={`mailto:${m.email}`} style={{ color: 'var(--brand-primary)', fontSize: '0.9rem' }}>{m.email}</a>
                </td>
                <td><span style={{ padding: '4px 8px', backgroundColor: '#FDFBF7', border: '1px solid #EAE6DF', borderRadius: '4px', fontSize: '0.85rem' }}>{m.subject.toUpperCase()}</span></td>
                <td style={{ maxWidth: '300px' }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#5A5551', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {m.message}
                  </p>
                </td>
                <td>
                  <span className={styles.badge} style={{ 
                    backgroundColor: m.status === 'UNREAD' ? '#FFF3E0' : m.status === 'READ' ? '#E3F2FD' : '#F5F5F5', 
                    color: m.status === 'UNREAD' ? '#E65100' : m.status === 'READ' ? '#1565C0' : '#616161' 
                  }}>
                    {m.status}
                  </span>
                </td>
                <td>
                  <MessageActions id={m.id} status={m.status} />
                </td>
              </tr>
            ))}
            {messages.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#7A7571' }}>No messages found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
