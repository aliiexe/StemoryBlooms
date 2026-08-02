'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore, ProductCard } from '@stemory/ui';
import { submitReview } from './actions';

export default function PDPClient({ product, recommendations }: { product: any, recommendations: any[] }) {
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<{success?: boolean; error?: string} | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.basePrice,
      quantity,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'MAD' }).format(amount / 100);
  };

  return (
    <div style={{ backgroundColor: 'var(--surface-primary)', minHeight: '100vh', paddingBottom: '6rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem' }}>
        
        {/* Breadcrumbs */}
        <div style={{ marginBottom: '2rem', fontSize: '0.9rem', color: '#7A7571' }}>
          <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
          <span style={{ margin: '0 0.5rem' }}>/</span>
          <Link href="/shop" style={{ color: 'inherit', textDecoration: 'none' }}>Shop</Link>
          <span style={{ margin: '0 0.5rem' }}>/</span>
          <span style={{ color: 'var(--brand-primary)', fontWeight: 500 }}>{product.name}</span>
        </div>

        {/* Product Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4rem' }}>
          {/* We will use a media query trick via inline style logic for desktop layout in real apps, but here we just stack on mobile */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4rem' }}>
            
            {/* Image Gallery */}
            <div style={{ flex: '1 1 500px' }}>
              <div style={{ position: 'relative', width: '100%', aspectRatio: '4/5', backgroundColor: '#EAE6DF', borderRadius: '24px', overflow: 'hidden' }}>
                <Image 
                  src="/hero-bouquet.png" 
                  alt={product.name} 
                  fill 
                  style={{ objectFit: 'cover' }} 
                  priority
                />
              </div>
            </div>

            {/* Product Info */}
            <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column' }}>
              <h1 style={{ fontFamily: 'var(--font-editorial)', fontSize: '3rem', color: 'var(--brand-primary)', marginBottom: '1rem', lineHeight: 1.1 }}>
                {product.name}
              </h1>
              
              <div style={{ fontSize: '1.5rem', fontWeight: 500, color: '#3A3531', marginBottom: '2rem' }}>
                {formatCurrency(product.basePrice)}
              </div>

              <div style={{ color: '#5A5551', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '3rem' }}>
                {product.description || "A beautiful everlasting bouquet meticulously handcrafted to bring eternal bloom to your space. Each pipe-cleaner flower is shaped by hand in Morocco, ensuring that no two arrangements are exactly alike."}
              </div>

              {/* Quantity & Add to Cart */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #D6CFE6', borderRadius: '50px', padding: '0.25rem' }}>
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '1.2rem', color: '#5A5551' }}
                  >-</button>
                  <span style={{ minWidth: '2rem', textAlign: 'center', fontWeight: 500 }}>{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '1.2rem', color: '#5A5551' }}
                  >+</button>
                </div>

                <button 
                  onClick={handleAddToCart}
                  disabled={!product.isAvailable}
                  style={{ 
                    flex: 1, 
                    padding: '1rem', 
                    backgroundColor: product.isAvailable ? (added ? '#1B5E20' : 'var(--brand-primary)') : '#EAE6DF', 
                    color: product.isAvailable ? '#FDFBF7' : '#9A9591', 
                    border: 'none', 
                    borderRadius: '50px', 
                    fontSize: '1rem', 
                    fontWeight: 500, 
                    cursor: product.isAvailable ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {product.isAvailable ? (added ? 'Added to Cart ✓' : 'Add to Cart') : 'Out of Stock'}
                </button>
              </div>

              <div style={{ borderTop: '1px solid #EAE6DF', paddingTop: '2rem', marginTop: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                  <span style={{ color: '#8C9C76', fontSize: '1.2rem' }}>✦</span>
                  <span style={{ fontSize: '0.95rem', color: '#5A5551' }}>Handcrafted in Morocco</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                  <span style={{ color: '#8C9C76', fontSize: '1.2rem' }}>✧</span>
                  <span style={{ fontSize: '0.95rem', color: '#5A5551' }}>Everlasting pipe-cleaner materials</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ color: '#8C9C76', fontSize: '1.2rem' }}>✦</span>
                  <span style={{ fontSize: '0.95rem', color: '#5A5551' }}>Processing Estimate: {product.processingEstimate || '3-5 business days'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div style={{ marginTop: '6rem', borderTop: '1px solid #EAE6DF', paddingTop: '4rem' }}>
          <h2 style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.5rem', color: 'var(--brand-primary)', marginBottom: '2rem' }}>
            Customer Reviews
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem' }}>
            {/* Reviews List */}
            <div>
              {product.reviews && product.reviews.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {product.reviews.map((r: any) => (
                    <div key={r.id} style={{ borderBottom: '1px solid #EAE6DF', paddingBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        {[...Array(5)].map((_, i) => (
                          <span key={i} style={{ color: i < r.rating ? '#F59E0B' : '#EAE6DF', fontSize: '1.2rem' }}>★</span>
                        ))}
                      </div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#3A3531' }}>{r.title}</h4>
                      <p style={{ color: '#5A5551', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1rem' }}>"{r.content}"</p>
                      <div style={{ fontSize: '0.85rem', color: '#9A9591' }}>
                        — {r.authorName} on {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(r.createdAt))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#7A7571' }}>No reviews yet. Be the first to share your thoughts!</p>
              )}
            </div>

            {/* Write a Review Form */}
            <div style={{ backgroundColor: '#FDFBF7', padding: '2rem', borderRadius: '16px', border: '1px solid #EAE6DF', height: 'fit-content' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#3A3531' }}>Write a Review</h3>
              
              {reviewStatus?.success ? (
                <div style={{ backgroundColor: '#E8F5E9', color: '#1B5E20', padding: '1rem', borderRadius: '8px' }}>
                  Thank you! Your review has been submitted and is pending approval.
                </div>
              ) : (
                <form action={async (formData) => {
                  setIsSubmittingReview(true);
                  const res = await submitReview(product.id, formData);
                  if (res.error) setReviewStatus({ error: res.error });
                  else setReviewStatus({ success: true });
                  setIsSubmittingReview(false);
                }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  
                  {reviewStatus?.error && (
                    <div style={{ color: '#C62828', backgroundColor: '#FFEBEE', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem' }}>
                      {reviewStatus.error}
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: '#4A4A4A' }}>Name *</label>
                    <input type="text" name="authorName" required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D6CFE6' }} />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: '#4A4A4A' }}>Rating *</label>
                    <select name="rating" required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D6CFE6' }}>
                      <option value="5">5 Stars - Excellent</option>
                      <option value="4">4 Stars - Very Good</option>
                      <option value="3">3 Stars - Average</option>
                      <option value="2">2 Stars - Poor</option>
                      <option value="1">1 Star - Terrible</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: '#4A4A4A' }}>Title (Optional)</label>
                    <input type="text" name="title" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D6CFE6' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: '#4A4A4A' }}>Review *</label>
                    <textarea name="content" required rows={4} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D6CFE6', resize: 'vertical' }}></textarea>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmittingReview}
                    style={{ padding: '1rem', backgroundColor: 'var(--brand-primary)', color: '#fff', border: 'none', borderRadius: '50px', cursor: isSubmittingReview ? 'not-allowed' : 'pointer', fontWeight: 500, marginTop: '0.5rem' }}
                  >
                    {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div style={{ marginTop: '8rem' }}>
            <h2 style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.5rem', color: 'var(--brand-primary)', marginBottom: '3rem', textAlign: 'center' }}>
              You Might Also Like
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '2rem' }}>
              {recommendations.map(rec => (
                <ProductCard key={rec.id} id={rec.id} title={rec.name} price={rec.basePrice} imageUrl="/hero-bouquet.png" />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
