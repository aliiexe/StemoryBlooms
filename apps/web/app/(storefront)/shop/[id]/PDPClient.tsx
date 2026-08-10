'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore, ProductCard } from '@stemory/ui';
import { submitReview } from './actions';
import styles from './pdp.module.css';

export default function PDPClient({ product, recommendations }: { product: any, recommendations: any[] }) {
  const [quantity, setQuantity] = useState(1);
  const images = Array.isArray(product?.images) && product.images.length > 0 ? product.images : ['/hero-bouquet.png'];
  const [activeImage, setActiveImage] = useState(images[0]);
  const [prevImage, setPrevImage] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const transitioningRef = useRef(false);
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<{success?: boolean; error?: string} | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const switchImage = (next: string) => {
    if (next === activeImage || transitioningRef.current) return;
    transitioningRef.current = true;
    setTransitioning(true);
    setPrevImage(activeImage);
    setActiveImage(next);
    setTimeout(() => {
      setPrevImage(null);
      setTransitioning(false);
      transitioningRef.current = false;
    }, 450);
  };

  // 10 second slideshow
  useEffect(() => {
    if (images.length <= 1 || isHovered) return;
    const interval = setInterval(() => {
      setActiveImage((current) => {
        const next = images[(images.indexOf(current) + 1) % images.length];
        if (!transitioningRef.current) {
          transitioningRef.current = true;
          setTransitioning(true);
          setPrevImage(current);
          setTimeout(() => {
            setPrevImage(null);
            setTransitioning(false);
            transitioningRef.current = false;
          }, 450);
        }
        return next;
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [images, isHovered]);

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.isSaleEnabled && product.salePrice ? product.salePrice : product.basePrice,
      quantity,
      imageUrl: images[0]
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'MAD' }).format(amount);
  };

  return (
    <div style={{ backgroundColor: 'var(--surface-primary)', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem', paddingBottom: '6rem' }}>
        
        {/* Breadcrumbs */}
        <div style={{ marginBottom: '2rem', fontSize: '0.9rem', color: '#7A7571' }}>
          <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
          <span style={{ margin: '0 0.5rem' }}>/</span>
          <Link href="/shop" style={{ color: 'inherit', textDecoration: 'none' }}>Shop</Link>
          <span style={{ margin: '0 0.5rem' }}>/</span>
          <span style={{ color: 'var(--brand-primary)', fontWeight: 500 }}>{product.name}</span>
        </div>

        {/* Main Product Layout (Split Column) */}
        <div className={styles.productLayout}>
          {/* Left Column: Sticky Image Gallery */}
          <div 
            className={styles.imageGallery}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div style={{ position: 'relative', width: '100%', aspectRatio: '4/5', backgroundColor: '#F9F8F6', borderRadius: '24px', overflow: 'hidden' }}>
              {/* Previous image stays underneath during transition */}
              {prevImage && (
                <Image
                  key={`prev-${prevImage}`}
                  src={prevImage}
                  alt={product.name}
                  fill
                  style={{ objectFit: 'cover', position: 'absolute', inset: 0 }}
                />
              )}
              {/* Active image fades in on top */}
              <Image
                key={`active-${activeImage}`}
                src={activeImage}
                alt={product.name}
                fill
                style={{
                  objectFit: 'cover',
                  position: 'absolute',
                  inset: 0,
                  opacity: transitioning ? 0 : 1,
                  transition: transitioning ? 'none' : 'opacity 0.45s ease-in-out',
                }}
                priority
              />
            </div>
            
            {/* Thumbnails */}
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {images.map((image: string, index: number) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => switchImage(image)}
                    style={{
                      position: 'relative',
                      width: '80px',
                      height: '80px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: activeImage === image ? '2px solid var(--brand-primary)' : '2px solid transparent',
                      padding: 0,
                      cursor: 'pointer',
                      background: '#F9F8F6',
                      transition: 'border-color 0.2s ease'
                    }}
                  >
                    <Image src={image} alt={`${product.name} thumbnail ${index + 1}`} fill style={{ objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Details */}
          <div style={{ display: 'flex', flexDirection: 'column', padding: '2rem 0' }}>
            <h1 style={{ fontFamily: 'var(--font-editorial)', fontSize: '3.5rem', color: 'var(--brand-primary)', marginBottom: '1rem', lineHeight: 1.1 }}>
              {product.name}
            </h1>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              {product.isSaleEnabled && product.salePrice ? (
                <>
                  <span style={{ fontWeight: 600, fontSize: '2rem', color: 'var(--brand-primary)' }}>{formatCurrency(product.salePrice)}</span>
                  <span style={{ textDecoration: 'line-through', color: '#888', fontSize: '1.25rem' }}>{formatCurrency(product.basePrice)}</span>
                </>
              ) : (
                <span style={{ fontWeight: 600, fontSize: '2rem', color: 'var(--brand-primary)' }}>{formatCurrency(product.basePrice)}</span>
              )}
            </div>

            <p style={{ color: '#5A5551', fontSize: '1.15rem', lineHeight: 1.7, marginBottom: '3rem' }}>
              {product.description || "A beautiful everlasting bouquet meticulously handcrafted to bring eternal bloom to your space. Each pipe-cleaner flower is shaped by hand in Morocco, ensuring that no two arrangements are exactly alike."}
            </p>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #D6CFE6', borderRadius: '50px', padding: '0.25rem', backgroundColor: '#fff' }}>
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{ background: 'none', border: 'none', padding: '0.5rem 1.25rem', cursor: 'pointer', fontSize: '1.2rem', color: '#5A5551' }}
                >-</button>
                <span style={{ minWidth: '2rem', textAlign: 'center', fontWeight: 600, fontSize: '1.1rem' }}>{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  style={{ background: 'none', border: 'none', padding: '0.5rem 1.25rem', cursor: 'pointer', fontSize: '1.2rem', color: '#5A5551' }}
                >+</button>
              </div>

              <button 
                onClick={handleAddToCart}
                disabled={!product.isAvailable}
                style={{ 
                  flex: 1, 
                  padding: '1rem 2rem', 
                  backgroundColor: product.isAvailable ? (added ? '#1B5E20' : 'var(--brand-primary)') : '#EAE6DF', 
                  color: product.isAvailable ? '#FDFBF7' : '#9A9591', 
                  border: 'none', 
                  borderRadius: '50px', 
                  fontSize: '1.1rem', 
                  fontWeight: 600, 
                  cursor: product.isAvailable ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  letterSpacing: '0.5px'
                }}
              >
                {product.isAvailable ? (added ? '✓ Added to Cart' : 'Add to Cart') : 'Out of Stock'}
              </button>
            </div>

            <div style={{ marginTop: '1.25rem', padding: '1rem', backgroundColor: '#FDFBF7', border: '1px solid #EAE6DF', borderRadius: '12px', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.2rem', color: '#8C9C76' }}>⏱️</span>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#5A5551', lineHeight: 1.5 }}>
                <strong>Made to Order:</strong> Since every piece is handmade with care, please allow <strong>2-3 days for production</strong> before your order ships, plus standard delivery time.
              </p>
            </div>

            {/* Value Props */}
            <div style={{ borderTop: '1px solid #EAE6DF', paddingTop: '2rem' }}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', alignItems: 'flex-start' }}>
                <span style={{ color: '#8C9C76', fontSize: '1.5rem', lineHeight: 1 }}>✦</span>
                <span style={{ fontSize: '1.05rem', color: '#5A5551' }}>Handcrafted in Morocco</span>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', alignItems: 'flex-start' }}>
                <span style={{ color: '#8C9C76', fontSize: '1.5rem', lineHeight: 1 }}>✧</span>
                <span style={{ fontSize: '1.05rem', color: '#5A5551' }}>Everlasting pipe-cleaner materials</span>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <span style={{ color: '#8C9C76', fontSize: '1.5rem', lineHeight: 1 }}>✦</span>
                <span style={{ fontSize: '1.05rem', color: '#5A5551' }}>Processing Estimate: {product.processingEstimate || '3-5 business days'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section (Full Width Below) */}
        <div style={{ marginTop: '8rem', borderTop: '1px solid #EAE6DF', paddingTop: '4rem' }}>
          <h2 style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.5rem', color: 'var(--brand-primary)', marginBottom: '3rem', textAlign: 'center' }}>
            Customer Reviews
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem' }}>
            
            {/* Reviews List */}
            <div style={{ order: 2 }}>
              {product.reviews && product.reviews.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                  {product.reviews.map((r: any) => (
                    <div key={r.id} style={{ borderBottom: '1px solid #EAE6DF', paddingBottom: '2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1rem' }}>
                        {[...Array(5)].map((_, i) => (
                          <span key={i} style={{ color: i < r.rating ? '#F59E0B' : '#EAE6DF', fontSize: '1.2rem' }}>★</span>
                        ))}
                      </div>
                      <h4 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.75rem', color: '#3A3531' }}>{r.title}</h4>
                      <p style={{ color: '#5A5551', fontSize: '1rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>"{r.content}"</p>
                      <div style={{ fontSize: '0.9rem', color: '#9A9591', fontStyle: 'italic' }}>
                        — {r.authorName} on {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(r.createdAt))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#FDFBF7', borderRadius: '16px', border: '1px dashed #D6CFE6' }}>
                  <p style={{ color: '#7A7571', fontSize: '1.1rem', margin: 0 }}>No reviews yet. Be the first to share your thoughts!</p>
                </div>
              )}
            </div>

            {/* Write a Review Form */}
            <div style={{ order: 1 }}>
              <div style={{ backgroundColor: '#FDFBF7', padding: '2.5rem', borderRadius: '24px', border: '1px solid #EAE6DF', position: 'sticky', top: '120px' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '2rem', color: '#3A3531', fontFamily: 'var(--font-editorial)' }}>Write a Review</h3>
                
                {reviewStatus?.success ? (
                  <div style={{ backgroundColor: '#E8F5E9', color: '#1B5E20', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', fontWeight: 500 }}>
                    Thank you! Your review has been submitted and is pending approval.
                  </div>
                ) : (
                  <form action={async (formData) => {
                    setIsSubmittingReview(true);
                    const res = await submitReview(product.id, formData);
                    if (res.error) setReviewStatus({ error: res.error });
                    else setReviewStatus({ success: true });
                    setIsSubmittingReview(false);
                  }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {reviewStatus?.error && (
                      <div style={{ color: '#C62828', backgroundColor: '#FFEBEE', padding: '1rem', borderRadius: '12px', fontSize: '0.95rem' }}>
                        {reviewStatus.error}
                      </div>
                    )}

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.95rem', color: '#4A4A4A', fontWeight: 500 }}>Name *</label>
                      <input type="text" name="authorName" required style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid #D6CFE6', fontSize: '1rem' }} />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.95rem', color: '#4A4A4A', fontWeight: 500 }}>Rating *</label>
                      <select name="rating" required style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid #D6CFE6', fontSize: '1rem', backgroundColor: '#fff' }}>
                        <option value="5">5 Stars - Excellent</option>
                        <option value="4">4 Stars - Very Good</option>
                        <option value="3">3 Stars - Average</option>
                        <option value="2">2 Stars - Poor</option>
                        <option value="1">1 Star - Terrible</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.95rem', color: '#4A4A4A', fontWeight: 500 }}>Title (Optional)</label>
                      <input type="text" name="title" style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid #D6CFE6', fontSize: '1rem' }} />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.95rem', color: '#4A4A4A', fontWeight: 500 }}>Review *</label>
                      <textarea name="content" required rows={4} style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid #D6CFE6', resize: 'vertical', fontSize: '1rem' }}></textarea>
                    </div>

                    <button 
                      type="submit" 
                      disabled={isSubmittingReview}
                      style={{ padding: '1rem', backgroundColor: 'var(--brand-primary)', color: '#fff', border: 'none', borderRadius: '50px', cursor: isSubmittingReview ? 'not-allowed' : 'pointer', fontWeight: 600, marginTop: '1rem', fontSize: '1.05rem', transition: 'background-color 0.2s' }}
                    >
                      {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div style={{ marginTop: '8rem', borderTop: '1px solid #EAE6DF', paddingTop: '4rem' }}>
            <h2 style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.5rem', color: 'var(--brand-primary)', marginBottom: '3rem', textAlign: 'center' }}>
              You Might Also Like
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '2rem' }}>
              {recommendations.map(rec => (
                <ProductCard key={rec.id} id={rec.id} title={rec.name} price={rec.basePrice} salePrice={rec.isSaleEnabled ? rec.salePrice : null} imageUrl={rec.images?.[0] || '/hero-bouquet.png'} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
