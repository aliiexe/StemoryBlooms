'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import styles from './page.module.css';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderNumber = searchParams.get('order');

  if (!orderNumber) {
    return (
      <div className={styles.card}>
        <h2 className={styles.title} style={{ fontSize: '2.5rem' }}>Missing Order</h2>
        <p className={styles.messageBox}>We could not find the order details. Please check your email for the confirmation link.</p>
        <button onClick={() => router.push('/shop')} className={styles.primaryBtn}>Return to Shop</button>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.topDeco} />
      
      <div className={styles.iconWrapper}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#F1F5EC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Check size={40} className={styles.successIcon} />
        </div>
      </div>
      
      <h1 className={styles.title}>Order Confirmed.</h1>
      <p className={styles.subtitle}>Thank you for your purchase</p>
      
      <div className={styles.orderBox}>
        <span className={styles.orderLabel}>Order Number</span>
        <span className={styles.orderValue}>{orderNumber}</span>
      </div>

      <div className={styles.messageBox}>
        Your order has been received and is now being processed. 
        We will contact you via WhatsApp shortly to confirm the final details 
        and coordinate the cash on delivery handoff.
      </div>

      <div className={styles.actions}>
        <button onClick={() => router.push(`/track?order=${orderNumber}`)} className={styles.primaryBtn}>
          Track Your Order
        </button>
        
        <button onClick={() => router.push(`/receipt/${orderNumber}`)} className={styles.secondaryBtn} style={{ marginTop: '0.5rem' }}>
          View / Print Receipt
        </button>
        
        <button onClick={() => router.push('/shop')} className={styles.secondaryBtn} style={{ marginTop: '0.5rem', background: 'transparent', border: 'none', color: '#6B7280' }}>
          Continue Shopping
        </button>
      </div>

      <div className={styles.supportLink}>
        Need help? <a href="https://instagram.com/stemory.blooms" target="_blank" rel="noreferrer">Message us on Instagram</a>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className={styles.container}>
      <Suspense fallback={<div className={styles.card}>Loading details...</div>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
