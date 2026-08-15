'use client';

import React, { useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { createPromoCode } from './actions';
import CustomDropdown from '../components/CustomDropdown';

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
  const [type, setType] = useState('PERCENTAGE');

  const labelStyle = { display: 'block', marginBottom: '0.5rem', color: '#5A5551', fontSize: '0.85rem', fontWeight: 500 };
  const inputStyle = { width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D6CFE6', backgroundColor: '#fff', fontSize: '1rem', color: '#3A3531' };

  async function handleSubmit(formData: FormData) {
    const res = await createPromoCode(formData);
    if (res?.error) {
      setError(res.error);
    } else {
      setError(null);
      formRef.current?.reset();
      setType('PERCENTAGE');
    }
  }

  return (
    <div style={{ backgroundColor: '#FDFBF7', padding: '2rem', borderRadius: '16px', border: '1px solid #EAE6DF', marginBottom: '2rem' }}>
      <h2 style={{ margin: '0 0 1.5rem 0', color: '#3A3531', fontSize: '1.25rem' }}>Create Promo Code</h2>
      {error && <div style={{ color: '#D32F2F', backgroundColor: '#FFEBEE', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
      <form ref={formRef} action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div>
            <label style={labelStyle}>Code (e.g. SUMMER20)</label>
            <input type="text" name="code" required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Discount Type</label>
            <CustomDropdown
              name="type"
              value={type}
              onChange={setType}
              options={[
                { value: 'PERCENTAGE', label: 'Percentage (%)' },
                { value: 'FIXED', label: 'Fixed Amount (MAD)' }
              ]}
            />
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
