'use client';

import React, { useState } from 'react';
import { saveExpense, deleteExpense } from './actions';
import styles from '../dashboard.module.css';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import ConfirmModal from '../components/ConfirmModal';

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
  const [showConfirm, setShowConfirm] = useState(false);

  // Format date for date input
  const defaultDate = expense?.date 
    ? new Date(expense.date).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  const confirmDelete = async () => {
    setShowConfirm(false);
    if (!expense?.id) return;
    await deleteExpense(expense.id);
    if (onSaved) onSaved();
  };

  return (
    <>
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
        {error && <div style={{ color: '#C62828', backgroundColor: '#FFEBEE', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem' }}>{error}</div>}
        
        {expense?.id && <input type="hidden" name="id" value={expense.id} />}

        <div>
          <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 500, color: '#5A5551' }}>Description</label>
          <input 
            type="text" 
            name="description" 
            defaultValue={expense?.description || ''} 
            required 
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D6CFE6' }} 
            placeholder="e.g. Meta Ads, Ribbon restock"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 500, color: '#5A5551' }}>Amount (MAD)</label>
            <input 
              type="number" 
              step="0.01"
              name="amount" 
              defaultValue={expense?.amount || ''} 
              required 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D6CFE6' }} 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 500, color: '#5A5551' }}>Date</label>
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
          <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 500, color: '#5A5551' }}>Category</label>
          <CustomSelect
            name="category"
            value={category}
            onChange={setCategory}
            options={EXPENSE_CATEGORIES}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 500, color: '#5A5551' }}>Notes (Optional)</label>
          <textarea 
            name="notes" 
            defaultValue={expense?.notes || ''} 
            rows={3}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D6CFE6', resize: 'vertical' }} 
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
              onClick={() => setShowConfirm(true)}
              style={{ padding: '0.75rem 1rem', border: '1px solid #FFEBEE', backgroundColor: '#FFEBEE', color: '#C62828', borderRadius: '8px', cursor: 'pointer' }}
            >
              Delete
            </button>
          )}
        </div>
      </form>
      
      <ConfirmModal
        isOpen={showConfirm}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action cannot be undone."
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
