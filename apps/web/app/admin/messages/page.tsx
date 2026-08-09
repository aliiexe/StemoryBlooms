import React from 'react';
import { db, contactMessage } from '@stemory/database';
import { desc } from 'drizzle-orm';
import styles from '../dashboard.module.css';
import { MessageActions } from './MessageActions';

export default async function AdminMessagesPage() {
  const messages = await db.query.contactMessage.findMany({
    orderBy: [desc(contactMessage.createdAt)]
  });

  return (
    <div className={styles.dashboard}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Support messages</h1>
          <p className={styles.pageSubtitle}>Stay on top of customer questions, follow-ups, and support requests.</p>
        </div>
      </header>

      <div className={styles.card}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Inbox</h2>
          <span className={styles.sectionHint}>{messages.length} conversations</span>
        </div>

        <div className={styles.messageList}>
          {messages.map((m) => (
            <article key={m.id} className={styles.messageCard}>
              <div className={styles.messageCardTop}>
                <div>
                  <div className={styles.messageName}>{m.firstName} {m.lastName}</div>
                  <a href={`mailto:${m.email}`} style={{ color: 'var(--brand-primary)', fontSize: '0.9rem' }}>{m.email}</a>
                </div>
                <div className={styles.messageMeta}>
                  <span className={styles.badge} style={{ backgroundColor: m.status === 'UNREAD' ? '#FFF3E0' : m.status === 'READ' ? '#E3F2FD' : '#F5F5F5', color: m.status === 'UNREAD' ? '#E65100' : m.status === 'READ' ? '#1565C0' : '#616161' }}>
                    {m.status}
                  </span>
                  <div style={{ marginTop: '0.35rem' }}>
                    {new Intl.DateTimeFormat('en-US', { dateStyle: 'short' }).format(new Date(m.createdAt))}
                  </div>
                </div>
              </div>

              <div className={styles.messageSubject}>{m.subject.toUpperCase()}</div>
              <p className={styles.messagePreview}>{m.message}</p>

              <div className={styles.messageFooter}>
                <span className={styles.sectionHint}>Customer support queue</span>
                <MessageActions id={m.id} status={m.status} />
              </div>
            </article>
          ))}

          {messages.length === 0 && (
            <div className={styles.messageCard} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
              No messages found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
