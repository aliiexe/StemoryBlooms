'use client';

import React, { useState } from 'react';
import { savePromoCode, deletePromoCode } from './actions';
import styles from '../dashboard.module.css';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { ToggleSwitch } from '../../../components/ui/ToggleSwitch';
import ConfirmModal from '../components/ConfirmModal';
import { toast } from 'sonner';

const TYPE_OPTIONS = [
  { label: 'Percentage (%)', value: 'PERCENTAGE' },
  { label: 'Fixed Amount (MAD)', value: 'FIXED' }
];

export function PromoForm({ promo, onSaved }: { promo?: any, onSaved?: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState(promo?.type || 'PERCENTAGE');
  const [isActive, setIsActive] = useState(promo ? promo.isActive : true);
  const [showConfirm, setShowConfirm] = useState(false);

  const confirmDelete = async () => {
    setShowConfirm(false);
    if (!promo?.id) return;
    const res = await deletePromoCode(promo.id);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success('Promo code deleted');
      if (onSaved) onSaved();
    }
  };

  return (
    <>
      <form 
        action={async (formData) => {
          setIsSubmitting(true);
          const res = await savePromoCode(formData);
          if (res?.error) {
            setError(res.error);
            toast.error(res.error);
          } else {
            toast.success(promo?.id ? 'Promo code updated' : 'Promo code created');
            if (onSaved) onSaved();
          }
          setIsSubmitting(false);
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        {error && <div style={{ color: '#C62828', backgroundColor: '#FFEBEE', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem' }}>{error}</div>}
        
        {promo?.id && <input type="hidden" name="id" value={promo.id} />}

        <div>
          <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 500, color: '#5A5551' }}>Promo Code</label>
          <input 
            type="text" 
            name="code" 
            defaultValue={promo?.code || ''} 
            required 
            placeholder="e.g. SUMMER2024"
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D6CFE6', textTransform: 'uppercase' }} 
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 500, color: '#5A5551' }}>Discount Type</label>
            <CustomSelect
              name="type"
              value={type}
              onChange={setType}
              options={TYPE_OPTIONS}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 500, color: '#5A5551' }}>Value</label>
            <input 
              type="number" 
              name="value" 
              defaultValue={promo?.value || ''} 
              required 
              min="0"
              step={type === 'PERCENTAGE' ? "1" : "0.01"}
              placeholder={type === 'PERCENTAGE' ? "10" : "50"}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D6CFE6' }} 
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 500, color: '#5A5551' }}>Usage Limit (Optional)</label>
            <input 
              type="number" 
              name="usageLimit" 
              defaultValue={promo?.usageLimit || ''} 
              min="1"
              placeholder="Leave empty for unlimited"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D6CFE6' }} 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 500, color: '#5A5551' }}>Minimum Spend (Optional)</label>
            <input 
              type="number" 
              name="minimumSpend" 
              defaultValue={promo?.minimumSpend || ''} 
              min="0"
              step="0.01"
              placeholder="e.g. 500"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D6CFE6' }} 
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#FDFBF7', borderRadius: '8px', border: '1px solid #EAE6DF', marginTop: '0.5rem' }}>
          <div>
            <div style={{ fontWeight: 500, fontSize: '0.9rem', color: '#3A3531' }}>Promo Status</div>
            <div style={{ fontSize: '0.8rem', color: '#7A7571' }}>{isActive ? 'Active and ready to use' : 'Disabled'}</div>
          </div>
          <ToggleSwitch 
            name="isActive"
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
        title="Delete Promo Code"
        message="Are you sure you want to delete this promo code? This action cannot be undone."
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
