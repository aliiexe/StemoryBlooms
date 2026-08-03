'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckoutPayloadSchema, CheckoutPayload } from '@stemory/contracts';
import { useCartStore } from '@stemory/ui';
import styles from './page.module.css';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutPayload>({
    resolver: zodResolver(CheckoutPayloadSchema),
    defaultValues: {
      cartItems: items.map(item => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        configuration: item.configuration
      }))
    }
  });

  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const deliveryFee = 20; // Default flat fee for now
  const total = subtotal + deliveryFee;

  const onSubmit = async (data: CheckoutPayload) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `checkout-${Date.now()}-${Math.random()}`
        },
        body: JSON.stringify(data)
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.message || 'Failed to place order');
      }

      clearCart();
      router.push(`/checkout/success?order=${result.orderNumber}`);
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <h2>Your cart is empty</h2>
        <button onClick={() => router.push('/shop')} className={styles.backBtn}>Continue Shopping</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.checkoutHeader}>
        <button onClick={() => router.back()} className={styles.backLink}>&larr; Checkout</button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.formLayout}>
        <div className={styles.mainColumn}>
          <section className={styles.section}>
            <h3>Contact</h3>
            <div className={styles.fieldGroup}>
              <label htmlFor="customerName">Full name</label>
              <input 
                id="customerName"
                autoComplete="name"
                {...register("customerName")}
                placeholder="Ali Bourak"
                className={errors.customerName ? styles.inputError : ''}
              />
              {errors.customerName && <span className={styles.errorText}>{errors.customerName.message}</span>}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="phoneNumber">Phone number</label>
              <input 
                id="phoneNumber"
                type="tel"
                autoComplete="tel"
                {...register("phoneNumber")}
                placeholder="06 12 34 56 78"
                className={errors.phoneNumber ? styles.inputError : ''}
              />
              {errors.phoneNumber && <span className={styles.errorText}>{errors.phoneNumber.message}</span>}
            </div>
          </section>

          <section className={styles.section}>
            <h3>Delivery Address</h3>
            <div className={styles.fieldGroup}>
              <label htmlFor="city">City</label>
              <select id="city" {...register("city")} className={errors.city ? styles.inputError : ''}>
                <option value="">Select a city...</option>
                <option value="Casablanca">Casablanca</option>
                <option value="Rabat">Rabat</option>
                <option value="Marrakech">Marrakech</option>
              </select>
              {errors.city && <span className={styles.errorText}>{errors.city.message}</span>}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="address">Address</label>
              <input 
                id="address"
                autoComplete="street-address"
                {...register("address")}
                placeholder="123, Maarif, Casablanca"
                className={errors.address ? styles.inputError : ''}
              />
              {errors.address && <span className={styles.errorText}>{errors.address.message}</span>}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="deliveryInstructions">Notes to rider (optional)</label>
              <input 
                id="deliveryInstructions"
                {...register("deliveryInstructions")}
                placeholder="Building B, second floor"
              />
            </div>
          </section>

          <section className={styles.section}>
            <h3>Payment Method</h3>
            <div className={styles.paymentMethod}>
              <input type="radio" checked readOnly id="cod" />
              <label htmlFor="cod">
                <strong>Cash on Delivery</strong>
                <span>Pay when you receive your order</span>
              </label>
            </div>
          </section>

          <section className={styles.section}>
            <h3>Terms and Conditions</h3>
            <div className={styles.checkboxGroup}>
              <input type="checkbox" id="termsAccepted" {...register("termsAccepted")} />
              <label htmlFor="termsAccepted">I accept the Terms and Conditions</label>
            </div>
            {errors.termsAccepted && <span className={styles.errorText}>{errors.termsAccepted.message}</span>}
            
            <div className={styles.checkboxGroup}>
              <input type="checkbox" id="deliveryPolicyAccepted" {...register("deliveryPolicyAccepted")} />
              <label htmlFor="deliveryPolicyAccepted">I accept the Delivery Policy</label>
            </div>
            {errors.deliveryPolicyAccepted && <span className={styles.errorText}>{errors.deliveryPolicyAccepted.message}</span>}

            <div className={styles.checkboxGroup}>
              <input type="checkbox" id="privacyNoticeAccepted" {...register("privacyNoticeAccepted")} />
              <label htmlFor="privacyNoticeAccepted">I accept the Privacy Notice</label>
            </div>
            {errors.privacyNoticeAccepted && <span className={styles.errorText}>{errors.privacyNoticeAccepted.message}</span>}

            <div className={styles.checkboxGroup}>
              <input type="checkbox" id="codConditionsAccepted" {...register("codConditionsAccepted")} />
              <label htmlFor="codConditionsAccepted">I accept the Cash on Delivery Conditions</label>
            </div>
            {errors.codConditionsAccepted && <span className={styles.errorText}>{errors.codConditionsAccepted.message}</span>}
          </section>
        </div>

        <div className={styles.sidebarColumn}>
          <div className={styles.summaryCard}>
            <h3>Order Summary</h3>
            <div className={styles.summaryItems}>
              {items.map(item => (
                <div key={item.id} className={styles.summaryItem}>
                  <div className={styles.summaryItemName}>
                    {item.name} <span className={styles.qty}>x{item.quantity}</span>
                  </div>
                  <div className={styles.summaryItemPrice}>{item.price * item.quantity} MAD</div>
                </div>
              ))}
            </div>
            
            <div className={styles.summaryLine}>
              <span>Subtotal</span>
              <span>{subtotal} MAD</span>
            </div>
            <div className={styles.summaryLine}>
              <span>Delivery Fee</span>
              <span>{deliveryFee} MAD</span>
            </div>
            
            <div className={styles.fieldGroup} style={{ marginTop: '1rem' }}>
              <label htmlFor="promoCode">Promo Code (Optional)</label>
              <input 
                id="promoCode"
                {...register("promoCode")}
                placeholder="e.g. SUMMER20"
                style={{ textTransform: 'uppercase' }}
              />
            </div>
            
            <div className={styles.fieldGroup} style={{ marginTop: '1rem', marginBottom: '1rem' }}>
              <label htmlFor="giftCardCode">Gift Card Code (Optional)</label>
              <input 
                id="giftCardCode"
                {...register("giftCardCode")}
                placeholder="e.g. GC-A1B2C3"
                style={{ textTransform: 'uppercase' }}
              />
            </div>

            <div className={`${styles.summaryLine} ${styles.totalLine}`}>
              <span>Total</span>
              <span>{total} MAD</span>
            </div>

            <div className={styles.deliveryDisclosure}>
              <p>You cannot select a delivery date or time. Delivery scheduling and the final delivery attempt are handled by the delivery company. We will prepare and hand over your order according to the stated processing estimate.</p>
            </div>

            {error && <div className={styles.globalError}>{error}</div>}

            <button type="submit" disabled={isSubmitting} className={styles.placeOrderBtn}>
              {isSubmitting ? 'Processing...' : 'Place Order'}
            </button>
            <p className={styles.whatsappNotice}>You will receive a confirmation on WhatsApp</p>
          </div>
        </div>
      </form>
    </div>
  );
}
