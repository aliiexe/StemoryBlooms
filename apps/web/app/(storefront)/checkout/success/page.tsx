'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import styles from './page.module.css';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderNumber = searchParams.get('order');

  if (!orderNumber) {
    return (
      <div className={styles.card}>
        <h2>Invalid Order</h2>
        <p>We could not find the order details.</p>
        <button onClick={() => router.push('/shop')} className={styles.primaryBtn}>Return to Shop</button>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.iconWrapper}>
        <CheckCircle size={64} className={styles.successIcon} />
      </div>
      
      <h1 className={styles.title}>Order Confirmed!</h1>
      <p className={styles.subtitle}>Thank you for your purchase.</p>
      
      <div className={styles.orderBox}>
        <span className={styles.orderLabel}>Order Number</span>
        <span className={styles.orderValue}>{orderNumber}</span>
      </div>

      <div className={styles.messageBox}>
        <p>
          Your order has been received and is now being processed. 
          We will contact you via WhatsApp shortly to confirm the final details 
          and coordinate the cash on delivery handoff.
        </p>
      </div>

      <div className={styles.actions}>
        <button onClick={() => router.push('/sign-up')} className={styles.primaryBtn}>
          Create an Account to track orders
        </button>
        
        <button onClick={() => router.push('/shop')} className={styles.secondaryBtn}>
          Continue Shopping
        </button>
      </div>

      <div className={styles.supportLink}>
        Need help? <a href="https://instagram.com/stemory.blooms" target="_blank" rel="noreferrer">Contact us on Instagram</a>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className={styles.container}>
      <Suspense fallback={<div className={styles.card}>Loading...</div>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
