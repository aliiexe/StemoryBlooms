'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@stemory/ui';
import { ZoomIn, X } from 'lucide-react';
import styles from './BuilderFlow.module.css';

type BuilderItem = {
  id: string;
  name: string;
  price: number;
  minQuantity?: number;
  maxQuantity?: number | null;
  imageUrl?: string | null;
};

export default function BuilderFlow({
  initialData,
  enabledSteps,
  baseFee = 19
}: {
  initialData: Record<string, BuilderItem[]>;
  enabledSteps: string[];
  baseFee?: number;
}) {
  // Build the actual step sequence: enabled content steps + Review at end
  const STEPS = [...enabledSteps, 'Review'];

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cardMessage, setCardMessage] = useState('');
  const [previewImage, setPreviewImage] = useState<{ url: string, name: string } | null>(null);
  const addItem = useCartStore((state) => state.addItem);
  const isCartOpen = useCartStore((state) => state.isCartOpen);
  const currentStep = STEPS[currentStepIndex];

  const updateQuantity = (item: BuilderItem, delta: number, currentQty: number) => {
    setCart((prev) => {
      // If adding item for the first time, default to minQuantity or 1
      if (currentQty === 0 && delta > 0) {
        return { ...prev, [item.id]: Math.max(item.minQuantity ?? 1, 1) };
      }

      const newQty = currentQty + delta;
      const minQty = item.minQuantity ?? 0;
      const maxQty = item.maxQuantity ?? Infinity;

      // If they try to go below minQty, they probably want to remove it entirely
      // Or we can just snap it to 0 if they hit minus while at minQty
      if (newQty < minQty && newQty > 0) {
        // Option 1: snap to 0
        const next = { ...prev };
        delete next[item.id];
        return next;
      }

      if (newQty <= 0) {
        const next = { ...prev };
        delete next[item.id];
        return next;
      }
      
      if (newQty > maxQty) {
        return prev; // Ignore, can't go above max
      }

      return { ...prev, [item.id]: newQty };
    });
  };

  const getSubtotal = () => {
    let total = 0;
    Object.values(initialData).flat().forEach((item: BuilderItem) => {
      total += (cart[item.id] || 0) * item.price;
    });

    const hasItems = Object.keys(cart).length > 0;
    
    // Determine when to show the base fee
    const wrappingIndex = STEPS.indexOf('Wrapping');
    const cardsIndex = STEPS.indexOf('Cards');
    
    const showFee = hasItems && (
      currentStep === 'Review' ||
      (wrappingIndex !== -1 && currentStepIndex >= wrappingIndex) ||
      (wrappingIndex === -1 && cardsIndex !== -1 && currentStepIndex >= cardsIndex)
    );

    if (showFee) {
      total += baseFee;
    }
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
        imageUrl: '/hero-bouquet.png',
        configuration: { ...cart, cardMessage: cardMessage.trim() || undefined }
      });

      setCart({});
      setCardMessage('');
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
            <div key={item.id} className={styles.itemCardContainer}>
              <div className={styles.itemCard}>
                <div className={styles.itemInfo}>
                  <div 
                    className={styles.itemImageWrapper}
                    onClick={() => setPreviewImage({ url: item.imageUrl || '/hero-bouquet.png', name: item.name })}
                    style={{ cursor: 'pointer', position: 'relative' }}
                  >
                    <img
                      src={item.imageUrl || '/hero-bouquet.png'}
                      alt={item.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center',
                        display: 'block',
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: '4px',
                      right: '4px',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      borderRadius: '50%',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                      <ZoomIn size={14} color="#5A5551" />
                    </div>
                  </div>
                  <div className={styles.itemDetails}>
                    <h3 className={styles.itemName}>{item.name}</h3>
                    <p className={styles.itemPrice}>{item.price === 0 ? 'Free' : `${item.price} MAD`}</p>
                    {item.minQuantity && item.minQuantity > 1 && (
                      <p style={{ fontSize: '0.8rem', color: '#9A9591', margin: '0.25rem 0 0 0' }}>
                        Min. {item.minQuantity} required
                      </p>
                    )}
                  </div>
                </div>
                <div className={styles.quantityPill}>
                  <button className={styles.qtyBtn} onClick={() => updateQuantity(item, -1, qty)} aria-label="Decrease">−</button>
                  <span className={styles.qtyValue}>{qty}</span>
                  <button className={styles.qtyBtn} onClick={() => updateQuantity(item, 1, qty)} aria-label="Increase">+</button>
                </div>
              </div>
              
              {/* If this is the Cards step and they selected this card, show the textarea */}
              {currentStep === 'Cards' && qty > 0 && (
                <div style={{ padding: '1rem', borderTop: '1px solid #EAE6DF', backgroundColor: '#FDFBF7' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#4E473F' }}>
                    Card Message
                  </label>
                  <textarea
                    value={cardMessage}
                    onChange={(e) => setCardMessage(e.target.value)}
                    maxLength={150}
                    rows={3}
                    placeholder="Write a short message (handwritten)..."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #D6CFE6',
                      resize: 'none',
                      fontFamily: 'inherit',
                      fontSize: '0.9rem'
                    }}
                  />
                  <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#9A9591', marginTop: '0.25rem' }}>
                    {cardMessage.length} / 150 characters
                  </div>
                </div>
              )}
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
        <div className={styles.reviewItem}>
          <span>Packaging & Base Materials</span>
          <span>{baseFee} MAD</span>
        </div>
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

      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewImage(null)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem'
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: '#FFF',
                borderRadius: '16px',
                padding: '1rem',
                maxWidth: '90vw',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                position: 'relative'
              }}
            >
              <button 
                onClick={() => setPreviewImage(null)}
                style={{
                  position: 'absolute',
                  top: '-12px',
                  right: '-12px',
                  background: '#FFF',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}
              >
                <X size={16} color="#3A3531" />
              </button>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#3A3531', textAlign: 'center' }}>
                {previewImage.name}
              </h3>
              <div style={{
                width: '100%',
                maxWidth: '400px',
                aspectRatio: '1/1',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: '#F0ECE5'
              }}>
                <img 
                  src={previewImage.url} 
                  alt={previewImage.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isCartOpen && (
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
      )}
    </div>
  );
}
