import React from 'react';
import { db } from '@stemory/database';
import styles from '../dashboard.module.css';
import { ExpenseForm } from './ExpenseForm';

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

  const totalRevenue = allOrders.reduce((acc, order) => acc + order.total, 0);
  const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  return (
    <div className={styles.dashboard}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className={styles.shopTitle} style={{ fontSize: '1.75rem', margin: 0 }}>Financial Tracking</h1>
        <p style={{ color: '#7A7571', marginTop: '0.5rem' }}>Track revenue and business expenses</p>
      </header>

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className={styles.card} style={{ backgroundColor: '#FDFBF7', border: '1px solid #EAE6DF' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#7A7571', fontSize: '1rem', fontWeight: 500 }}>Total Revenue</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 600, color: '#3A3531' }}>{totalRevenue.toLocaleString()} MAD</p>
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

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
        <div className={styles.card}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#3A3531', fontSize: '1.25rem' }}>Recent Expenses</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td>{new Intl.DateTimeFormat('en-GB').format(new Date(e.date))}</td>
                  <td><strong>{e.description}</strong></td>
                  <td><span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#F5F5F5', borderRadius: '4px', fontSize: '0.8rem' }}>{e.category}</span></td>
                  <td style={{ color: '#C62828', fontWeight: 500 }}>-{e.amount} MAD</td>
                  <td>
                    <button style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', textDecoration: 'underline' }}>Edit</button>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#7A7571' }}>No expenses logged yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.card}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#3A3531', fontSize: '1.25rem' }}>Log Expense</h3>
          <ExpenseForm />
        </div>
      </div>
    </div>
  );
}
