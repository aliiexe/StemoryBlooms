'use client';

import React, {  useState  } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from '../dashboard.module.css';
import { ExpenseForm } from './ExpenseForm';
import { backfillMaterialExpenses } from './actions';

export function AdminFinancesClient({ 
  initialExpenses, 
  totalRevenue, 
  totalExpenses,
  netProfit 
}: { 
  initialExpenses: any[], 
  totalRevenue: number, 
  totalExpenses: number,
  netProfit: number 
}) {

  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [backfilling, setBackfilling] = useState(false);

  async function handleBackfill() {
    setBackfilling(true);
    const result = await backfillMaterialExpenses();
    setBackfilling(false);
    if (result.backfilled === 0) alert('All materials already have expense records.');
    else alert(`Backfilled ${result.backfilled} material(s). Refresh to see updated totals.`);
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'MAD' }).format(amount);
  };

  return (
    <div>
      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className={styles.card} style={{ backgroundColor: '#FDFBF7', border: '1px solid #EAE6DF' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#7A7571', fontSize: '1rem', fontWeight: 500 }}>Total Revenue</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 600, color: '#3A3531' }}>{formatCurrency(totalRevenue)}</p>
        </div>
        <div className={styles.card} style={{ backgroundColor: '#FFEBEE', border: '1px solid #FFCDD2' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#C62828', fontSize: '1rem', fontWeight: 500 }}>Total Expenses</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 600, color: '#C62828' }}>{formatCurrency(totalExpenses)}</p>
        </div>
        <div className={styles.card} style={{ backgroundColor: netProfit >= 0 ? '#E8F5E9' : '#FFEBEE', border: `1px solid ${netProfit >= 0 ? '#C8E6C9' : '#FFCDD2'}` }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: netProfit >= 0 ? '#2E7D32' : '#C62828', fontSize: '1rem', fontWeight: 500 }}>Net Profit (Loss)</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 600, color: netProfit >= 0 ? '#2E7D32' : '#C62828' }}>{formatCurrency(netProfit)}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
        <div className={styles.card}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#3A3531', fontSize: '1.25rem' }}>Expense Ledger</h3>
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
              {initialExpenses.map((e) => (
                <tr key={e.id}>
                  <td>{new Intl.DateTimeFormat('en-GB').format(new Date(e.date))}</td>
                  <td>
                    <strong>{e.description}</strong>
                    {e.relatedMaterialId && <div style={{ fontSize: '0.75rem', color: '#8C9C76', marginTop: '0.25rem' }}>✦ Linked to Raw Material</div>}
                    {e.relatedOrderId && <div style={{ fontSize: '0.75rem', color: '#8C9C76', marginTop: '0.25rem' }}>✦ Linked to Order</div>}
                  </td>
                  <td><span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#F5F5F5', borderRadius: '4px', fontSize: '0.8rem' }}>{e.category}</span></td>
                  <td style={{ color: '#C62828', fontWeight: 500 }}>-{e.amount} MAD</td>
                  <td>
                    <button 
                      onClick={() => setEditingExpense(e)}
                      style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {initialExpenses.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#7A7571' }}>No expenses logged yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.card}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#3A3531', fontSize: '1.25rem' }}>
            {editingExpense ? 'Edit Expense' : 'Log Manual Expense'}
          </h3>
          {!editingExpense && (
            <button
              onClick={handleBackfill}
              disabled={backfilling}
              style={{ width: '100%', padding: '0.6rem', marginBottom: '1rem', background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', color: '#F57F17' }}
            >
              {backfilling ? 'Backfilling…' : '⚡ Backfill existing material expenses'}
            </button>
          )}
          <ExpenseForm 
            key={editingExpense ? editingExpense.id : 'new'} 
            expense={editingExpense} 
            onSaved={() => setEditingExpense(null)} 
          />
          {editingExpense && (
            <button 
              onClick={() => setEditingExpense(null)}
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.75rem', background: 'transparent', border: '1px solid #EAE6DF', borderRadius: '8px', cursor: 'pointer' }}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
