'use client';

import React, { useState } from 'react';
import { togglePromoCode, deletePromoCode } from './actions';
import ConfirmModal from '../components/ConfirmModal';

export function PromoActions({ id, isActive }: { id: string, isActive: boolean }) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button 
          onClick={() => togglePromoCode(id, !isActive)}
          style={{
            padding: '4px 8px', borderRadius: '4px', border: '1px solid #D6CFE6',
            backgroundColor: '#FDFBF7', cursor: 'pointer', fontSize: '0.8rem'
          }}
        >
          {isActive ? 'Disable' : 'Enable'}
        </button>
        <button 
          onClick={() => setShowConfirm(true)}
          style={{
            padding: '4px 8px', borderRadius: '4px', border: 'none',
            backgroundColor: '#FFEBEE', color: '#D32F2F', cursor: 'pointer', fontSize: '0.8rem'
          }}
        >
          Delete
        </button>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        title="Delete Promo Code"
        message="Are you sure you want to delete this promo code? This action cannot be undone."
        confirmText="Delete"
        onConfirm={async () => {
          setShowConfirm(false);
          await deletePromoCode(id);
        }}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
