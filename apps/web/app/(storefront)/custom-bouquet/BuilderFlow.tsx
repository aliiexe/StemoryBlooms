'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@stemory/ui';
import styles from './BuilderFlow.module.css';

type BuilderItem = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
};

export default function BuilderFlow({
  initialData,
  enabledSteps,
}: {
  initialData: Record<string, BuilderItem[]>;
  enabledSteps: string[];
}) {
  // Build the actual step sequence: enabled content steps + Review at end
  const STEPS = [...enabledSteps, 'Review'];

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [cart, setCart] = useState<Record<string, number>>({});

  const addItem = useCartStore((state) => state.addItem);
  const currentStep = STEPS[currentStepIndex];

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) => {
      const newQty = (prev[id] || 0) + delta;
      if (newQty <= 0) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: newQty };
    });
  };

  const getSubtotal = () => {
    let total = 0;
    Object.values(initialData).flat().forEach((item: BuilderItem) => {
      total += (cart[item.id] || 0) * item.price;
    });
    return total;
  };

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      const total = getSubtotal();
      if (total === 0 && Object.keys(cart).length === 0) {
        alert('Please select some items first.');
        return;
      }

      addItem({
        id: `custom-${Date.now()}`,
        name: 'Custom Built Bouquet',
        price: total,
        quantity: 1,
        imageUrl: '/hero-bouquet.png'
      });

      setCart({});
      setCurrentStepIndex(0);
    }
  };

  const renderItems = (items: BuilderItem[]) => {
    if (items.length === 0) {
      return (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#9A9591' }}>
          No items available in this category yet.
        </div>
      );
    }

    return (
      <div className={styles.itemList}>
        {items.map(item => {
          const qty = cart[item.id] || 0;
          return (
            <div key={item.id} className={styles.itemCard}>
              <div className={styles.itemInfo}>
                <div className={styles.itemImageWrapper}>
                  <Image
                    src={item.imageUrl || '/hero-bouquet.png'}
                    alt={item.name}
                    width={60}
                    height={60}
                    className={styles.itemImage}
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className={styles.itemDetails}>
                  <h3 className={styles.itemName}>{item.name}</h3>
                  <p className={styles.itemPrice}>{item.price === 0 ? 'Free' : `${item.price} MAD`}</p>
                </div>
              </div>
              <div className={styles.quantityPill}>
                <button className={styles.qtyBtn} onClick={() => updateQuantity(item.id, -1)} aria-label="Decrease quantity">−</button>
                <span className={styles.qtyValue}>{qty}</span>
                <button className={styles.qtyBtn} onClick={() => updateQuantity(item.id, 1)} aria-label="Increase quantity">+</button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderReview = () => {
    const allItems = Object.values(initialData).flat() as BuilderItem[];
    const cartItems = allItems.filter(item => (cart[item.id] || 0) > 0);

    if (cartItems.length === 0) {
      return <div className={styles.emptyReview}>Your bouquet is empty. Go back and add some items!</div>;
    }

    return (
      <div className={styles.reviewList}>
        <h2 className={styles.stepTitle}>Order Summary</h2>
        {cartItems.map(item => (
          <div key={item.id} className={styles.reviewItem}>
            <span>{cart[item.id]}x {item.name}</span>
            <span>{item.price === 0 ? 'Free' : `${(cart[item.id] * item.price)} MAD`}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.builderFlow}>
      <div className={styles.stepper}>
        {STEPS.map((step, idx) => (
          <div key={step} className={styles.stepIndicator}>
            <div className={`${styles.stepCircle} ${idx <= currentStepIndex ? styles.activeStep : ''}`}>
              {idx + 1}
            </div>
            <span className={`${styles.stepLabel} ${idx <= currentStepIndex ? styles.activeLabel : ''}`}>{step}</span>
            {idx < STEPS.length - 1 && (
              <div className={`${styles.stepLine} ${idx < currentStepIndex ? styles.activeLine : ''}`} />
            )}
          </div>
        ))}
      </div>

      <div className={styles.stepContent}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStepIndex}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {currentStep === 'Review'
              ? renderReview()
              : renderItems(initialData[currentStep] || [])}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className={styles.stickyFooter}>
        <div className={styles.footerContent}>
          {currentStepIndex > 0 && (
            <button
              className={styles.nextBtn}
              onClick={() => setCurrentStepIndex(i => i - 1)}
              style={{ background: 'transparent', color: 'var(--brand-primary)', border: '1px solid var(--brand-primary)' }}
            >
              ← Back
            </button>
          )}
          <div className={styles.subtotal}>
            <span>Subtotal</span>
            <span className={styles.subtotalValue}>{getSubtotal()} MAD</span>
          </div>
          <button className={styles.nextBtn} onClick={handleNext}>
            {currentStepIndex < STEPS.length - 1 ? `Next: ${STEPS[currentStepIndex + 1]}` : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}
