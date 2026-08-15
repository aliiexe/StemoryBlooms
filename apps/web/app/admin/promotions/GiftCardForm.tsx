'use client';

import React, { useState } from 'react';
import { saveGiftCard, deleteGiftCard } from './actions';
import styles from '../dashboard.module.css';
import { ToggleSwitch } from '../../../components/ui/ToggleSwitch';
import ConfirmModal from '../components/ConfirmModal';

export function GiftCardForm({ card, onSaved }: { card?: any, onSaved?: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(card ? card.isActive : true);
  const [showConfirm, setShowConfirm] = useState(false);

  // Auto-generate code if new
  const [code, setCode] = useState(card?.code || `GC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);

  const confirmDelete = async () => {
    setShowConfirm(false);
    if (!card?.id) return;
    await deleteGiftCard(card.id);
    if (onSaved) onSaved();
  };

  return (
    <>
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
        {error && <div style={{ color: '#C62828', backgroundColor: '#FFEBEE', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem' }}>{error}</div>}
        
        {card?.id && <input type="hidden" name="id" value={card.id} />}

        <div>
          <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 500, color: '#5A5551' }}>Gift Card Code</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              name="code" 
              value={code} 
              onChange={e => setCode(e.target.value.toUpperCase())}
              required 
              style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #D6CFE6', fontFamily: 'monospace' }} 
            />
            <button 
              type="button"
              onClick={() => setCode(`GC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`)}
              style={{ padding: '0 1rem', borderRadius: '8px', border: '1px solid #D6CFE6', backgroundColor: '#FDFBF7', cursor: 'pointer' }}
            >
              Generate
            </button>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 500, color: '#5A5551' }}>Initial Value (MAD)</label>
          <input 
            type="number" 
            name="initialValue" 
            step="0.01"
            defaultValue={card?.initialValue || ''} 
            required 
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D6CFE6' }} 
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 500, color: '#5A5551' }}>Sender Name</label>
            <input 
              type="text" 
              name="senderName" 
              defaultValue={card?.senderName || ''} 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D6CFE6' }} 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 500, color: '#5A5551' }}>Recipient Name</label>
            <input 
              type="text" 
              name="recipientName" 
              defaultValue={card?.recipientName || ''} 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D6CFE6' }} 
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 500, color: '#5A5551' }}>Recipient Email (Optional)</label>
          <input 
            type="email" 
            name="recipientEmail" 
            defaultValue={card?.recipientEmail || ''} 
            placeholder="For digital delivery"
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D6CFE6' }} 
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#FDFBF7', borderRadius: '8px', border: '1px solid #EAE6DF' }}>
          <div>
            <div style={{ fontWeight: 500, fontSize: '0.9rem', color: '#3A3531' }}>Card Status</div>
            <div style={{ fontSize: '0.8rem', color: '#7A7571' }}>{isActive ? 'Active and ready to use' : 'Disabled'}</div>
          </div>
          <ToggleSwitch 
            checked={isActive} 
            onChange={setIsActive} 
          />
          <input type="hidden" name="isActive" value={isActive ? 'true' : 'false'} />
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
        title="Delete Gift Card"
        message="Are you sure you want to delete this gift card? This action cannot be undone."
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
