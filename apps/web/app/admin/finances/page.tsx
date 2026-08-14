import React from 'react';
import { db } from '@stemory/database';
import styles from '../dashboard.module.css';
import { AdminFinancesClient } from './AdminFinancesClient';

export default async function AdminFinancesPage() {
  const expenses = await db.query.expense.findMany({
    orderBy: (expense, { desc }) => [desc(expense.date)]
  });

  const orders = await db.query.order.findMany({
    where: (order, { eq }) => eq(order.paymentStatus, 'PAID')
  });

  // Since we haven't implemented actual payment processing to mark orders as PAID,
  // we will just sum all orders for demonstration purposes in this phase.
  const allOrders = await db.query.order.findMany();

  // The user requested to exclude delivery fees from revenue since it goes directly to the delivery company.
  const totalDeliveryFees = allOrders.reduce((acc, order) => acc + (order.deliveryFee || 0), 0);
  // Revenue = product sales only (subtotal - discount), never includes delivery fees
  const totalRevenue = allOrders.reduce((acc, order) => acc + Math.max(0, (order.subtotal || 0) - (order.discount || 0)), 0);
  const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
  
  // Net Profit = Product Revenue - Total Expenses
  const netProfit = totalRevenue - totalExpenses;

  return (
    <div className={styles.dashboard}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className={styles.shopTitle} style={{ fontSize: '1.75rem', margin: 0 }}>Financial Tracking</h1>
        <p style={{ color: '#7A7571', marginTop: '0.5rem' }}>Track revenue and business expenses</p>
      </header>

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className={styles.card} style={{ backgroundColor: '#FDFBF7', border: '1px solid #EAE6DF' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#7A7571', fontSize: '1rem', fontWeight: 500 }}>Total Revenue</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 600, color: '#3A3531' }}>{totalRevenue.toLocaleString()} MAD</p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: '#9A9591' }}>Product sales only</p>
        </div>
        <div className={styles.card} style={{ backgroundColor: '#FFF8E1', border: '1px solid #FFE082' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#F57F17', fontSize: '1rem', fontWeight: 500 }}>Delivery Fees</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 600, color: '#F57F17' }}>{totalDeliveryFees.toLocaleString()} MAD</p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: '#9A9591' }}>Passed to carrier</p>
        </div>
        <div className={styles.card} style={{ backgroundColor: '#FFEBEE', border: '1px solid #FFCDD2' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#C62828', fontSize: '1rem', fontWeight: 500 }}>Total Expenses</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 600, color: '#C62828' }}>{totalExpenses.toLocaleString()} MAD</p>
        </div>
        <div className={styles.card} style={{ backgroundColor: netProfit >= 0 ? '#E8F5E9' : '#FFEBEE', border: `1px solid ${netProfit >= 0 ? '#C8E6C9' : '#FFCDD2'}` }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: netProfit >= 0 ? '#2E7D32' : '#C62828', fontSize: '1rem', fontWeight: 500 }}>Net Profit (Loss)</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 600, color: netProfit >= 0 ? '#2E7D32' : '#C62828' }}>{netProfit.toLocaleString()} MAD</p>
        </div>
      </div>

      <AdminFinancesClient initialExpenses={expenses} />
    </div>
  );
}
