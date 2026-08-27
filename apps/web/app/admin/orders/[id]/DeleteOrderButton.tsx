'use client';

import React, { useState } from 'react';
import { deleteOrder } from '../actions';
import ConfirmModal from '../../components/ConfirmModal';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

export default function DeleteOrderButton({ orderId }: { orderId: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const confirmDelete = async () => {
    setShowConfirm(false);
    setIsSubmitting(true);
    await deleteOrder(orderId);
    toast.success('Order deleted');
    setIsSubmitting(false);
    router.push('/admin/orders');
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
        title="Delete Order"
      >
        <Trash2 size={16} />
      </button>

      <ConfirmModal
        isOpen={showConfirm}
        title="Delete Order"
        message="Are you sure you want to delete this order? All related items will be deleted and this action cannot be undone."
        confirmText="Delete Order"
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
