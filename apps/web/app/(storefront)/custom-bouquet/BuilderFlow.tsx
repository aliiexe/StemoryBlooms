'use client';

import { useState } from 'react';
import { useCartStore, StoreModal } from '@stemory/ui';
import { ZoomIn, X } from 'lucide-react';
import styles from './BuilderFlow.module.css';

type BuilderItem = {
  id: string;
  name: string;
  price: number;
  stock?:number;minQuantity?: number;
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
  const [selectionError,setSelectionError]=useState('');
  const [cardMessage, setCardMessage] = useState('');
  const [previewImage, setPreviewImage] = useState<{ url: string, name: string } | null>(null);
  const addItem = useCartStore((state) => state.addItem);
  const isCartOpen = useCartStore((state) => state.isCartOpen);
  const currentStep = STEPS[currentStepIndex];

  const updateQuantity = (item: BuilderItem, delta: number) => {
    setSelectionError('');
    setCart(previous => {
      const current = previous[item.id] || 0;
      const minimum = Math.max(1, item.minQuantity || 1);
      const maximum = Math.min(100, item.maxQuantity ?? 100, item.stock ?? 100);
      const nextQuantity = current === 0 && delta > 0 ? minimum : current + delta;
      if (nextQuantity > maximum) return previous;
      const next = { ...previous };
      if (nextQuantity < minimum) delete next[item.id];
      else {
        if (currentStep === 'Wrapping' || currentStep === 'Cards') {
          for (const option of initialData[currentStep] || []) delete next[option.id];
        }
        next[item.id] = currentStep === 'Wrapping' || currentStep === 'Cards' ? 1 : nextQuantity;
      }
      return next;
    });
  };
  const getSubtotal = () => {
    const selected = Object.keys(cart).length > 0;
    return Object.values(initialData).flat().reduce((sum, item) => sum + (cart[item.id] || 0) * item.price, selected ? baseFee : 0);
  };
  const hasFlowers = Object.entries(initialData).filter(([section]) => !['Cards','Wrapping'].includes(section)).flatMap(([,items]) => items).some(item => (cart[item.id] || 0) > 0);

  const handleNext = () => {
    if ((currentStep === 'Flowers' || currentStep === 'Review') && !hasFlowers) { setSelectionError('Choose at least one flower or decorative detail for your bouquet.'); return; }
    setSelectionError('');
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      const total = getSubtotal();
      if (total === 0 && Object.keys(cart).length === 0) {
        setSelectionError('Select at least one component before adding a bouquet.');
        return;
      }

      setSelectionError('');
      addItem({
        id: `custom-${Date.now()}`,
        kind: 'CUSTOM',
        name: 'Custom Built Bouquet',
        price: total,
        quantity: 1,
        description:Object.entries(cart).map(([id,count])=>`${count} × ${Object.values(initialData).flat().find(item=>item.id===id)?.name||'Selected component'}`).join(', '),
        maxQuantity:Math.max(1,Math.min(100,...Object.entries(cart).map(([id,count])=>Math.floor((Object.values(initialData).flat().find(item=>item.id===id)?.stock||100)/count)))),
        imageUrl: '/hero-bouquet.png',
        configuration: { components: { ...cart }, cardMessage: cardMessage.trim() || undefined }
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
                  <button type="button" aria-label={`Preview ${item.name}`}
                    className={styles.itemImageWrapper}
                    onClick={() => setPreviewImage({ url: item.imageUrl || '/hero-bouquet.png', name: item.name })}
                    style={{ cursor: 'pointer', position: 'relative',border:0,padding:0 }}
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
                  </button>
                  <div className={styles.itemDetails}>
                    <h3 className={styles.itemName}>{item.name}</h3>
                    <p className={styles.itemPrice}>
                      {item.price === 0 ? (currentStep === 'Cards' ? 'Free' : 'Included') : `${item.price} MAD`}
                    </p>
                    {(item.minQuantity ?? 0) > 1 && (
                      <p style={{ fontSize: '0.8rem', color: '#9A9591', margin: '0.25rem 0 0 0' }}>
                        Minimum selection: {item.minQuantity}
                      </p>
                    )}
                  </div>
                </div>
                <div className={styles.quantityPill}>
                  <button className={styles.qtyBtn} onClick={() => updateQuantity(item, -1)} disabled={qty === 0} aria-label={`Remove one ${item.name}`}>−</button>
                  <span className={styles.qtyValue}>{qty}</span>
                  <button className={styles.qtyBtn} onClick={() => updateQuantity(item, 1)} disabled={qty >= Math.min(item.maxQuantity ?? 100, item.stock ?? 100) || (['Cards','Wrapping'].includes(currentStep) && qty > 0)} aria-label={`Add one ${item.name}`}>+</button>
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
            <span>
              {item.price === 0
                ? (initialData['Cards']?.some(c => c.id === item.id) ? 'Free' : 'Included')
                : `${(cart[item.id] * item.price)} MAD`}
            </span>
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
            <button type="button" aria-label={`Go to ${step}`} aria-current={idx === currentStepIndex ? 'step' : undefined} disabled={idx > currentStepIndex && !hasFlowers} onClick={() => { setSelectionError(''); setCurrentStepIndex(idx); }} className={`${styles.stepCircle} ${idx <= currentStepIndex ? styles.activeStep : ''}`}>
              {idx + 1}
            </button>
            <span className={`${styles.stepLabel} ${idx <= currentStepIndex ? styles.activeLabel : ''}`}>{step}</span>
            {idx < STEPS.length - 1 && (
              <div className={`${styles.stepLine} ${idx < currentStepIndex ? styles.activeLine : ''}`} />
            )}
          </div>
        ))}
      </div>

      {selectionError&&<p role="alert" style={{color:'#8c2635'}}>{selectionError}</p>}
      <p className={styles.currentStepLabel} aria-live="polite">{currentStep} — step {currentStepIndex + 1} of {STEPS.length}</p>
      <div className={styles.stepContent}>
        <div key={currentStepIndex}>
            {currentStep === 'Review'
              ? renderReview()
              : renderItems(initialData[currentStep] || [])}
        </div>
      </div>

      <StoreModal open={Boolean(previewImage)} label={previewImage?`Preview ${previewImage.name}`:'Image preview'} onClose={()=>setPreviewImage(null)}>{previewImage&&<div style={{minHeight:'100dvh',display:'grid',placeItems:'center',padding:24,boxSizing:'border-box'}} onClick={()=>setPreviewImage(null)}><article style={{padding:16,background:'white',borderRadius:16,maxWidth:440,width:'100%',boxSizing:'border-box'}} onClick={event=>event.stopPropagation()}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:16}}><h2 style={{fontSize:'1.2rem'}}>{previewImage.name}</h2><button type="button" aria-label="Close image preview" onClick={()=>setPreviewImage(null)} style={{minWidth:44,minHeight:44,border:0,borderRadius:24,background:'#f4f0e9'}}><X size={20}/></button></div><img src={previewImage.url} alt={previewImage.name} style={{width:'100%',maxHeight:'70dvh',objectFit:'contain'}}/></article></div>}</StoreModal>

      {!isCartOpen && (
        <div className={styles.stickyFooter}>
          <div className={styles.footerContent}>
            {currentStepIndex > 0 && (
              <button
                className={styles.nextBtn}
                onClick={() => setCurrentStepIndex(i => i - 1)}
                style={{ background: 'transparent', color: 'var(--brand-primary)', border: '1px solid var(--brand-primary)' }}
              >
                Back
              </button>
            )}
            <div className={styles.subtotal}>
              <span>Selected bouquet · packaging included</span>
              <span className={styles.subtotalValue}>{Object.keys(cart).length?getSubtotal():`From ${baseFee}`} MAD</span>
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
