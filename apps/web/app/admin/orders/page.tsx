import React from 'react';
import { db, order } from '@stemory/database';
import { desc } from 'drizzle-orm';
import styles from '../dashboard.module.css';
import { OrderActions } from './OrderActions';
import Link from 'next/link';

export default async function AdminOrdersPage() {
  const orders = await db.query.order.findMany({
    orderBy: [desc(order.createdAt)],
    with: { customer: true, orderItems: true }
  });

  const summary = {
    new: orders.filter((o) => o.status === 'NEW' || o.status === 'CONFIRMED').length,
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

        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
            No orders found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Items</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/admin/orders/${o.id}`} style={{ fontWeight: 600, color: 'var(--brand-primary)', textDecoration: 'none' }}>
                        #{o.orderNumber}
                      </Link>
                    </td>
                    <td>
                      {o.customer ? `${o.customer.firstName} ${o.customer.lastName}` : 'Guest'}
                    </td>
                    <td>{Math.max(0, o.total - o.deliveryFee)} MAD</td>
                    <td>
                      <span className={styles.badge} style={{ 
                        backgroundColor: o.paymentStatus === 'PAID' ? '#E8F5E9' : '#FDECEC', 
                        color: o.paymentStatus === 'PAID' ? '#067647' : '#B42318' 
                      }}>
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td>
                      {Array.isArray(o.orderItems) && o.orderItems.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {o.orderItems.slice(0, 2).map((item: any) => (
                            <span key={item.id}>{item.quantity}x {item.productName}</span>
                          ))}
                          {o.orderItems.length > 2 && <span>+{o.orderItems.length - 2} more</span>}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td>
                      <OrderActions orderId={o.id} currentStatus={o.status} sentToInfinidis={o.sentToInfinidis} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
