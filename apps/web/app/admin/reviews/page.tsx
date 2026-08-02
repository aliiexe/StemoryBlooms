import React from 'react';
import { prisma } from '@stemory/database';
import styles from '../dashboard.module.css';
import { ReviewActions } from './ReviewActions';

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: 'desc' },
    include: { product: true }
  });

  return (
    <div className={styles.dashboard}>
      <header className={styles.shopHeader} style={{ padding: '0', marginBottom: '2rem' }}>
        <h1 className={styles.shopTitle} style={{ fontSize: '1.75rem' }}>Review Moderation</h1>
      </header>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>All Reviews</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Product</th>
              <th>Author & Rating</th>
              <th>Content</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((r) => (
              <tr key={r.id}>
                <td style={{ whiteSpace: 'nowrap' }}>
                  {new Intl.DateTimeFormat('en-US', { dateStyle: 'short' }).format(new Date(r.createdAt))}
                </td>
                <td>{r.product.name}</td>
                <td>
                  <strong>{r.authorName}</strong><br />
                  <span style={{ color: '#F59E0B' }}>{'★'.repeat(r.rating)}</span>
                </td>
                <td style={{ maxWidth: '300px' }}>
                  <strong>{r.title}</strong>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#5A5551', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.content}
                  </p>
                </td>
                <td>
                  <span className={styles.badge} style={{ 
                    backgroundColor: r.status === 'APPROVED' ? '#E8F5E9' : r.status === 'REJECTED' ? '#FFEBEE' : '#FFF3E0', 
                    color: r.status === 'APPROVED' ? '#1B5E20' : r.status === 'REJECTED' ? '#C62828' : '#E65100' 
                  }}>
                    {r.status}
                  </span>
                </td>
                <td>
                  <ReviewActions id={r.id} status={r.status} />
                </td>
              </tr>
            ))}
            {reviews.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#7A7571' }}>No reviews found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
