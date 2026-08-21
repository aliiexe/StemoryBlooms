import React from 'react';
import { db, order } from '@stemory/database';
import { desc } from 'drizzle-orm';
import styles from '../dashboard.module.css';
import { OrderActions } from './OrderActions';

export default async function AdminOrdersPage() {
  const orders = await db.query.order.findMany({
    orderBy: [desc(order.createdAt)],
    with: { customer: true, orderItems: true }
  });

  const summary = {
    new: orders.filter((o) => o.status === 'NEW').length,
    processing: orders.filter((o) => o.status === 'IN_PRODUCTION' || o.status === 'READY').length,
    completed: orders.filter((o) => o.status === 'COMPLETED' || o.status === 'DELIVERED').length,
    cancelled: orders.filter((o) => o.status === 'CANCELLED').length,
  };

  return (
    <div className={styles.dashboard}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Orders</h1>
          <p className={styles.pageSubtitle}>Track every order, manage fulfillment, and resolve cancellations from one place.</p>
        </div>
      </header>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statCardLabel}>New</div>
          <div className={styles.statCardValue}>{summary.new}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statCardLabel}>In progress</div>
          <div className={styles.statCardValue}>{summary.processing}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statCardLabel}>Completed</div>
          <div className={styles.statCardValue}>{summary.completed}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statCardLabel}>Cancelled</div>
          <div className={styles.statCardValue}>{summary.cancelled}</div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent orders</h2>
          <span className={styles.sectionHint}>{orders.length} total</span>
        </div>

        <div className={styles.orderList}>
          {orders.map((o) => (
            <article key={o.id} className={styles.orderCard}>
              <div className={styles.orderCardTop}>
                <div>
                  <div className={styles.orderTitle}>#{o.orderNumber}</div>
                  <div className={styles.orderMeta}>{o.customer?.firstName} {o.customer?.lastName}</div>
                </div>
                <span className={styles.badge} style={{ backgroundColor: o.status === 'CANCELLED' ? '#FDECEC' : (o.status === 'COMPLETED' || o.status === 'DELIVERED') ? '#E8F5E9' : '#FFF8E1', color: o.status === 'CANCELLED' ? '#B42318' : (o.status === 'COMPLETED' || o.status === 'DELIVERED') ? '#067647' : '#B54708' }}>
                  {o.status}
                </span>
              </div>

              <div className={styles.orderSummaryRow}>
                <span><strong>Total:</strong> {o.total} MAD</span>
                <span><strong>Payment:</strong> {o.paymentStatus}</span>
                <span><strong>Placed:</strong> {new Date(o.createdAt).toLocaleDateString()}</span>
              </div>

              {Array.isArray(o.orderItems) && o.orderItems.length > 0 && (
                <div style={{ marginTop: '0.9rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {o.orderItems.slice(0, 3).map((item: any) => (
                    <span key={item.id} className={styles.orderItemChip}>{item.productName}</span>
                  ))}
                </div>
              )}

              <div className={styles.orderFooter}>
                <div className={styles.orderMeta}>Fast actions for fulfillment and customer support</div>
                <OrderActions orderId={o.id} currentStatus={o.status} sentToInfinidis={o.sentToInfinidis} />
              </div>
            </article>
          ))}

          {orders.length === 0 && (
            <div className={styles.orderCard} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
              No orders found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
