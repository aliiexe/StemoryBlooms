'use client';

import React, { useState } from 'react';
import { deleteOrder } from '../actions';
import ConfirmModal from '../../components/ConfirmModal';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Archive } from 'lucide-react';

export default function DeleteOrderButton({ orderId }: { orderId: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const confirmDelete = async () => {
    setShowConfirm(false);
    setIsSubmitting(true);
    try {
      const result = await deleteOrder(orderId);
      if (result?.error) { toast.error(result.error); return; }
      toast.success('Order archived');
      router.push('/admin/orders');
    } catch { toast.error('Could not archive this order. Try again.'); }
    finally { setIsSubmitting(false); }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        disabled={isSubmitting}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '36px', height: '36px',
          border: '1px solid #FEE2E2', backgroundColor: '#FEF2F2',
          color: '#DC2626', borderRadius: '6px', cursor: 'pointer'
        }}
        title="Archive Order"
      >
        <Archive size={16} />
      </button>

      <ConfirmModal
        isOpen={showConfirm}
        title="Archive Order"
        message="Hide this completed or cancelled order from active lists? Its items, stock movements, and financial history will be retained."
        confirmText="Archive Order"
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
