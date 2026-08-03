'use client';

import React, { useState } from 'react';
import { saveExpense, deleteExpense } from './actions';
import styles from '../dashboard.module.css';
import { CustomSelect } from '../../../components/ui/CustomSelect';

const EXPENSE_CATEGORIES = [
  { label: 'Raw Materials / Supplies', value: 'SUPPLIES' },
  { label: 'Packaging', value: 'PACKAGING' },
  { label: 'Marketing & Ads', value: 'MARKETING' },
  { label: 'Rent / Utilities', value: 'RENT' },
  { label: 'Software / Subscriptions', value: 'SOFTWARE' },
  { label: 'Other', value: 'OTHER' }
];

export function ExpenseForm({ expense, onSaved }: { expense?: any, onSaved?: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState(expense?.category || 'SUPPLIES');

  // Format date for date input
  const defaultDate = expense?.date 
    ? new Date(expense.date).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  return (
    <form 
      action={async (formData) => {
        setIsSubmitting(true);
        const res = await saveExpense(formData);
        if (res?.error) setError(res.error);
        else if (onSaved) onSaved();
        setIsSubmitting(false);
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
    >
      {error && <div style={{ color: '#C62828', fontSize: '0.9rem' }}>{error}</div>}
      
      {expense?.id && <input type="hidden" name="id" value={expense.id} />}

      <div>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Description</label>
        <input 
          type="text" 
          name="description" 
          defaultValue={expense?.description || ''} 
          required 
          placeholder="e.g., Facebook Ads, 50x Premium Boxes"
          style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D6CFE6' }} 
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Amount (MAD)</label>
          <input 
            type="number" 
            name="amount" 
            defaultValue={expense?.amount || ''} 
            required 
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D6CFE6' }} 
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Date</label>
          <input 
            type="date" 
            name="date" 
            defaultValue={defaultDate} 
            required 
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D6CFE6' }} 
          />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Category</label>
        <CustomSelect 
          name="category"
          options={EXPENSE_CATEGORIES}
          value={category}
          onChange={setCategory}
        />
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className={styles.submitBtn} 
          style={{ flex: 1, padding: '0.75rem', margin: 0, borderRadius: '8px' }}
        >
          {isSubmitting ? 'Saving...' : 'Add Expense'}
        </button>
        {expense?.id && (
          <button 
            type="button" 
            onClick={async () => {
              if (confirm('Delete this expense?')) {
                await deleteExpense(expense.id);
                if (onSaved) onSaved();
              }
            }}
            style={{ padding: '0.75rem 1rem', border: '1px solid #FFEBEE', backgroundColor: '#FFEBEE', color: '#C62828', borderRadius: '8px', cursor: 'pointer' }}
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
