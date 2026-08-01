'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@stemory/ui';
import styles from './BuilderFlow.module.css';

const STEPS = ['Flowers', 'Wrapping', 'Add-ons', 'Review'];

const ITEMS_DATA = {
  Flowers: [
    { id: 'f1', name: 'Lavender Stem', price: 15 },
    { id: 'f2', name: 'Pink Tulip', price: 20 },
    { id: 'f3', name: 'White Rose', price: 25 },
    { id: 'f4', name: 'Sunflower', price: 30 },
  ],
  Wrapping: [
    { id: 'w1', name: 'Classic Kraft', price: 10 },
    { id: 'w2', name: 'Silk Ribbon', price: 15 },
    { id: 'w3', name: 'Premium Mesh', price: 20 },
  ],
  'Add-ons': [
    { id: 'a1', name: 'Gift Card', price: 5 },
    { id: 'a2', name: 'Fairy Lights', price: 15 },
    { id: 'a3', name: 'Crystal Pins', price: 10 },
  ],
};

export default function BuilderFlow() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [cart, setCart] = useState<Record<string, number>>({});
  
  const addItem = useCartStore((state) => state.addItem);

  const currentStep = STEPS[currentStepIndex];

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) => {
      const newQty = (prev[id] || 0) + delta;
      if (newQty <= 0) {
        const newCart = { ...prev };
        delete newCart[id];
        return newCart;
      }
      return { ...prev, [id]: newQty };
    });
  };

  const getSubtotal = () => {
    let total = 0;
    Object.values(ITEMS_DATA).flat().forEach(item => {
      total += (cart[item.id] || 0) * item.price;
    });
    return total;
  };

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      const total = getSubtotal();
      if (total === 0) {
        alert("Please select some items first.");
        return;
      }
      
      // Add as a single 'Custom Bouquet' item
      addItem({
        id: `custom-${Date.now()}`,
        name: 'Custom Built Bouquet',
        price: total,
        quantity: 1,
        imageUrl: '/hero-bouquet.png'
      });
      
      // Reset builder
      setCart({});
      setCurrentStepIndex(0);
    }
  };

  const renderItems = (items: typeof ITEMS_DATA.Flowers) => (
    <div className={styles.itemList}>
      {items.map(item => {
        const qty = cart[item.id] || 0;
        return (
          <div key={item.id} className={styles.itemCard}>
            <div className={styles.itemInfo}>
              <div className={styles.itemImageWrapper}>
                <Image src="/hero-bouquet.png" alt={item.name} width={60} height={60} className={styles.itemImage} />
              </div>
              <div className={styles.itemDetails}>
                <h3 className={styles.itemName}>{item.name}</h3>
                <p className={styles.itemPrice}>{item.price} MAD</p>
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

  const renderReview = () => {
    const allItems = Object.values(ITEMS_DATA).flat();
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
            <span>{(cart[item.id] * item.price)} MAD</span>
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
            {currentStep === 'Flowers' && renderItems(ITEMS_DATA.Flowers)}
            {currentStep === 'Wrapping' && renderItems(ITEMS_DATA.Wrapping)}
            {currentStep === 'Add-ons' && renderItems(ITEMS_DATA['Add-ons'])}
            {currentStep === 'Review' && renderReview()}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className={styles.stickyFooter}>
        <div className={styles.footerContent}>
          <div className={styles.subtotal}>
            <span>Subtotal</span>
            <span className={styles.subtotalValue}>{getSubtotal()} MAD</span>
          </div>
          <button className={styles.nextBtn} onClick={handleNext}>
            {currentStepIndex < STEPS.length - 1 ? `Next: ${STEPS[currentStepIndex + 1]}` : 'Checkout'}
          </button>
        </div>
      </div>
    </div>
  );
}
