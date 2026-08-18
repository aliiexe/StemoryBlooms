'use client';

import React, { useState } from 'react';
import { saveCustomBuilderSettings } from './actions';
import styles from '../dashboard.module.css';

interface CustomBuilderSettingsFormProps {
  initialBaseFee: number;
}

export function CustomBuilderSettingsForm({ initialBaseFee }: CustomBuilderSettingsFormProps) {
  const [baseFee, setBaseFee] = useState(initialBaseFee);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('customBouquetBaseFee', baseFee.toString());

      const result = await saveCustomBuilderSettings(formData);
      if (result.success) {
        setMessage('Custom builder settings saved!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Error saving settings.');
      }
    } catch {
      setMessage('An error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.card}>
      <h3 className={styles.cardTitle}>Custom Builder Settings</h3>
      <p style={{ color: '#7A7571', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
        Configure the base fee added to custom bouquets to cover wrapping paper, notes, ribbon, and packaging materials.
      </p>

      <div style={{ marginBottom: '2rem', maxWidth: '300px' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#5A5551', fontSize: '0.95rem' }}>
          Base Materials Fee (MAD)
        </label>
        <input
          type="number"
          value={baseFee}
          onChange={(e) => setBaseFee(parseInt(e.target.value) || 0)}
          min="0"
          required
          style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #D6CFE6', fontSize: '1rem' }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          type="submit"
          disabled={isSaving}
          className={styles.submitBtn}
          style={{ width: 'auto', padding: '0.85rem 2rem', margin: 0, borderRadius: '50px' }}
        >
          {isSaving ? 'Saving…' : 'Save Settings'}
        </button>
        {message && (
          <span style={{ color: message.includes('Error') ? '#C62828' : '#1B5E20', fontSize: '0.9rem', fontWeight: 500 }}>
            {message}
          </span>
        )}
      </div>
    </form>
  );
}
