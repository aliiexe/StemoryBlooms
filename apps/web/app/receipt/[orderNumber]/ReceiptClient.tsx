'use client';

import React from 'react';
import { Printer, Download, Share, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

type ReceiptProps = {
  order: any; // The full order with customer and items
};

export default function ReceiptClient({ order }: ReceiptProps) {
  const router = useRouter();
  
  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Receipt for Order #${order.orderNumber}`,
          text: `Here is the receipt for your order ${order.orderNumber} from Stemory Blooms.`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Receipt link copied to clipboard!');
    }
  };

  return (
    <div style={{ maxWidth: '800px', width: '100%' }}>
      {/* Non-printable controls */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; padding: 0; }
          .receipt-card { box-shadow: none !important; border: none !important; padding: 0 !important; }
        }
      `}} />
      
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', border: '1px solid #D1D5DB', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>
          <ChevronLeft size={18} /> Back
        </button>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={handleShare} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', border: '1px solid #D1D5DB', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>
            <Share size={18} /> Share Link
          </button>
          <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#111827', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>
            <Printer size={18} /> Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Printable Receipt Area */}
      <div className="receipt-card" style={{ background: 'white', padding: '3rem', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #E5E7EB', paddingBottom: '2rem', marginBottom: '2rem', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', color: '#111827', margin: 0 }}>Stemory Blooms</h1>
            <p style={{ color: '#6B7280', margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>Beautiful arrangements for every moment.</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: '1.5rem', color: '#111827', margin: 0 }}>RECEIPT</h2>
            <p style={{ color: '#6B7280', margin: '0.5rem 0 0 0', fontSize: '0.9rem', fontWeight: 600 }}>Order #{order.orderNumber}</p>
            <p style={{ color: '#6B7280', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>{new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString()}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
          <div>
            <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: '#9CA3AF', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Billed To</h3>
            <p style={{ margin: 0, fontWeight: 600, color: '#111827' }}>{order.customer.firstName} {order.customer.lastName}</p>
            {order.customer.email && <p style={{ margin: '0.25rem 0 0 0', color: '#4B5563', fontSize: '0.9rem' }}>{order.customer.email}</p>}
            <p style={{ margin: '0.25rem 0 0 0', color: '#4B5563', fontSize: '0.9rem' }}>{order.customer.phone}</p>
          </div>
          <div>
            <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: '#9CA3AF', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Delivery Address</h3>
            <p style={{ margin: 0, color: '#4B5563', fontSize: '0.9rem' }}>{order.deliveryAddress?.addressLine1 || 'TBD'}</p>
            <p style={{ margin: '0.25rem 0 0 0', color: '#4B5563', fontSize: '0.9rem' }}>{order.deliveryAddress?.city || 'TBD'}</p>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2.5rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E5E7EB', color: '#6B7280', fontSize: '0.9rem' }}>
              <th style={{ padding: '0.75rem 0', textAlign: 'left', fontWeight: 600 }}>Description</th>
              <th style={{ padding: '0.75rem 0', textAlign: 'center', fontWeight: 600 }}>Qty</th>
              <th style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: 600 }}>Price</th>
              <th style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: 600 }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item: any) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                <td style={{ padding: '1rem 0', color: '#111827', fontWeight: 500 }}>{item.productName}</td>
                <td style={{ padding: '1rem 0', textAlign: 'center', color: '#4B5563' }}>{item.quantity}</td>
                <td style={{ padding: '1rem 0', textAlign: 'right', color: '#4B5563' }}>{item.unitPrice} MAD</td>
                <td style={{ padding: '1rem 0', textAlign: 'right', color: '#111827', fontWeight: 500 }}>{item.totalPrice} MAD</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '100%', maxWidth: '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', color: '#4B5563' }}>
              <span>Subtotal</span>
              <span>{order.subtotal} MAD</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', color: '#4B5563' }}>
              <span>Delivery Fee</span>
              <span>{order.deliveryFee} MAD</span>
            </div>
            {order.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', color: '#B91C1C' }}>
                <span>Discount</span>
                <span>-{order.discount} MAD</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', marginTop: '0.5rem', borderTop: '2px solid #E5E7EB', fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>
              <span>Total</span>
              <span>{order.total} MAD</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', color: '#4B5563', fontSize: '0.9rem' }}>
              <span>Payment Status</span>
              <span style={{ fontWeight: 600, color: order.paymentStatus === 'PAID' ? '#059669' : '#D97706' }}>
                {order.paymentStatus === 'PAID' ? 'PAID' : 'CASH ON DELIVERY'}
              </span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '4rem', textAlign: 'center', color: '#9CA3AF', fontSize: '0.9rem', borderTop: '1px solid #F3F4F6', paddingTop: '2rem' }}>
          <p style={{ margin: 0 }}>Thank you for shopping with Stemory Blooms!</p>
          <p style={{ margin: '0.25rem 0 0 0' }}>instagram.com/stemory.blooms</p>
        </div>
      </div>
    </div>
  );
}
