'use client';

import React, { useState } from 'react';
import { saveGiftCard, deleteGiftCard } from './actions';
import styles from '../dashboard.module.css';
import { ToggleSwitch } from '../../../components/ui/ToggleSwitch';

export function GiftCardForm({ card, onSaved }: { card?: any, onSaved?: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(card ? card.isActive : true);

  // Auto-generate code if new
  const [code, setCode] = useState(card?.code || `GC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);

  return (
    <form 
      action={async (formData) => {
        setIsSubmitting(true);
        const res = await saveGiftCard(formData);
        if (res?.error) setError(res.error);
        else if (onSaved) onSaved();
        setIsSubmitting(false);
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
    >
      {error && <div style={{ color: '#C62828', fontSize: '0.9rem' }}>{error}</div>}
      
      {card?.id && <input type="hidden" name="id" value={card.id} />}

      <div>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Gift Card Code</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text" 
            name="code" 
            value={code} 
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required 
            style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #D6CFE6', textTransform: 'uppercase' }} 
          />
          {!card && (
            <button 
              type="button" 
              onClick={() => setCode(`GC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`)}
              style={{ padding: '0 1rem', backgroundColor: '#F5F5F5', border: '1px solid #EAE6DF', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              Generate
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Initial Balance (MAD)</label>
          <input 
            type="number" 
            name="initialBalance" 
            defaultValue={card?.initialBalance || ''} 
            required 
            placeholder="500"
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D6CFE6' }} 
          />
        </div>
        {card && (
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Current Balance (MAD)</label>
            <input 
              type="number" 
              name="currentBalance" 
              defaultValue={card.currentBalance} 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D6CFE6' }} 
            />
          </div>
        )}
      </div>

      <div style={{ marginTop: '0.5rem' }}>
        <ToggleSwitch 
          name="isActive"
          label="Active"
          checked={isActive}
          onChange={setIsActive}
        />
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className={styles.submitBtn} 
          style={{ flex: 1, padding: '0.75rem', margin: 0, borderRadius: '8px' }}
        >
          {isSubmitting ? 'Saving...' : (card ? 'Update Gift Card' : 'Create Gift Card')}
        </button>
        {card?.id && (
          <button 
            type="button" 
            onClick={async () => {
              if (confirm('Delete this gift card?')) {
                await deleteGiftCard(card.id);
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
