'use client';

import React, { useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { createPromoCode } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button 
      type="submit" 
      disabled={pending}
      style={{
        padding: '0.75rem 1.5rem', backgroundColor: '#3A3531', color: '#FDFBF7',
        border: 'none', borderRadius: '8px', cursor: pending ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-sans)', fontWeight: 500, opacity: pending ? 0.7 : 1
      }}
    >
      {pending ? 'Creating...' : 'Create Promo Code'}
    </button>
  );
}

export default function PromoForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    const res = await createPromoCode(formData);
    if (res.error) {
      setError(res.error);
    } else {
      formRef.current?.reset();
    }
  };

  const inputStyle = {
    padding: '0.75rem', borderRadius: '8px', border: '1px solid #EAE6DF',
    fontFamily: 'var(--font-sans)', fontSize: '0.9rem', width: '100%', outline: 'none'
  };

  const labelStyle = {
    display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 500, color: '#4A4A4A'
  };

  return (
    <div style={{ backgroundColor: 'var(--surface-primary)', padding: '2rem', borderRadius: '12px', border: '1px solid #EAE6DF', marginBottom: '2rem' }}>
      <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#3A3531' }}>Create New Promo Code</h3>
      
      <form ref={formRef} action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {error && <div style={{ color: '#C62828', backgroundColor: '#FFEBEE', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem' }}>{error}</div>}
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Code (e.g. SUMMER20)</label>
            <input type="text" name="code" required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Discount Type</label>
            <select name="type" required style={inputStyle}>
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED">Fixed Amount (MAD)</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Value</label>
            <input type="number" name="value" required min="1" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Usage Limit (Optional)</label>
            <input type="number" name="usageLimit" min="1" placeholder="e.g. 100" style={inputStyle} />
          </div>
        </div>

        <div style={{ marginTop: '0.5rem' }}>
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}
