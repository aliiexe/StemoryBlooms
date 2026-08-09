import React from 'react';
import { db } from '@stemory/database';
import { order, customer } from '@stemory/database/schema';
import { eq, desc } from 'drizzle-orm';
import styles from '../dashboard.module.css'; // Reusing dashboard styles for simplicity



export default async function AdminOrdersPage() {
  const rows = await db
    .select({ order, customer })
    .from(order)
    .leftJoin(customer, eq(order.customerId, customer.id))
    .orderBy(desc(order.createdAt));

  const orders = rows.map((r) => ({
    ...r.order,
    customer: r.customer!
  }));

  return (
    <div className={styles.dashboard}>
      <header className={styles.shopHeader} style={{ padding: '0', marginBottom: '2rem' }}>
        <h1 className={styles.shopTitle} style={{ fontSize: '1.75rem' }}>Manage Orders</h1>
      </header>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{o.orderNumber}</td>
                <td>{o.customer.firstName} {o.customer.lastName}</td>
                <td>{o.total} MAD</td>
                <td>
                  <span className={styles.badge} style={{ backgroundColor: o.status === 'NEW' ? '#FFF8E1' : '#F5F5F5', color: o.status === 'NEW' ? '#F57F17' : '#616161' }}>
                    {o.status}
                  </span>
                </td>
                <td>{new Date(o.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#7A7571' }}>No orders found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
