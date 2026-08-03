'use client';

import React, { useState } from 'react';
import { savePromoCode, deletePromoCode } from './actions';
import styles from '../dashboard.module.css';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { ToggleSwitch } from '../../../components/ui/ToggleSwitch';

const TYPE_OPTIONS = [
  { label: 'Percentage (%)', value: 'PERCENTAGE' },
  { label: 'Fixed Amount (MAD)', value: 'FIXED' }
];

export function PromoForm({ promo, onSaved }: { promo?: any, onSaved?: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState(promo?.type || 'PERCENTAGE');
  const [isActive, setIsActive] = useState(promo ? promo.isActive : true);

  return (
    <form 
      action={async (formData) => {
        setIsSubmitting(true);
        const res = await savePromoCode(formData);
        if (res?.error) setError(res.error);
        else if (onSaved) onSaved();
        setIsSubmitting(false);
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
    >
      {error && <div style={{ color: '#C62828', fontSize: '0.9rem' }}>{error}</div>}
      
      {promo?.id && <input type="hidden" name="id" value={promo.id} />}

      <div>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Promo Code</label>
        <input 
          type="text" 
          name="code" 
          defaultValue={promo?.code || ''} 
          required 
          placeholder="e.g., SUMMER20"
          style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D6CFE6', textTransform: 'uppercase' }} 
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Discount Type</label>
          <CustomSelect 
            name="type"
            options={TYPE_OPTIONS}
            value={type}
            onChange={setType}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Discount Value</label>
          <input 
            type="number" 
            name="value" 
            defaultValue={promo?.value || ''} 
            required 
            placeholder={type === 'PERCENTAGE' ? '20' : '100'}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D6CFE6' }} 
          />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Usage Limit (Optional)</label>
        <input 
          type="number" 
          name="usageLimit" 
          defaultValue={promo?.usageLimit || ''} 
          placeholder="e.g., 50 uses"
          style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D6CFE6' }} 
        />
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
          {isSubmitting ? 'Saving...' : (promo ? 'Update Promo Code' : 'Create Promo Code')}
        </button>
        {promo?.id && (
          <button 
            type="button" 
            onClick={async () => {
              if (confirm('Delete this promo code?')) {
                await deletePromoCode(promo.id);
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
