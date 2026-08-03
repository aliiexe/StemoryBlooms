'use client';

import React, { useState } from 'react';
import { saveMaterial, deleteMaterial } from './actions';
import styles from '../dashboard.module.css';

export function MaterialForm({ material, onSaved }: { material?: any, onSaved?: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form 
      action={async (formData) => {
        setIsSubmitting(true);
        const res = await saveMaterial(formData);
        if (res?.error) setError(res.error);
        else if (onSaved) onSaved();
        setIsSubmitting(false);
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
    >
      {error && <div style={{ color: '#C62828', fontSize: '0.9rem' }}>{error}</div>}
      
      {material?.id && <input type="hidden" name="id" value={material.id} />}

      <div>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Material Name (e.g., Red Rose, Large Box)</label>
        <input 
          type="text" 
          name="name" 
          defaultValue={material?.name || ''} 
          required 
          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #D6CFE6' }} 
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Stock Quantity</label>
          <input 
            type="number" 
            name="quantity" 
            defaultValue={material?.quantity || 0} 
            required 
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #D6CFE6' }} 
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Cost per unit (MAD)</label>
          <input 
            type="number" 
            name="cost" 
            defaultValue={material?.cost || ''} 
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #D6CFE6' }} 
          />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Low Stock Alert Threshold</label>
        <input 
          type="number" 
          name="lowStockThreshold" 
          defaultValue={material?.lowStockThreshold || ''} 
          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #D6CFE6' }} 
        />
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className={styles.submitBtn} 
          style={{ flex: 1, padding: '0.5rem', margin: 0 }}
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
        {material?.id && (
          <button 
            type="button" 
            onClick={async () => {
              if (confirm('Delete this material?')) {
                await deleteMaterial(material.id);
                if (onSaved) onSaved();
              }
            }}
            style={{ padding: '0.5rem 1rem', border: '1px solid #FFEBEE', backgroundColor: '#FFEBEE', color: '#C62828', borderRadius: '4px', cursor: 'pointer' }}
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
