import React from 'react';
import { prisma } from '@stemory/database';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ReviewsPage() {
  const reviews = await prisma.review.findMany({
    where: { status: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    include: { product: true }
  });

  // Calculate average rating
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <main style={{ backgroundColor: 'var(--surface-primary)', minHeight: '100vh', padding: '6rem 2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <header style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-editorial)', fontSize: '3.5rem', color: 'var(--brand-primary)', marginBottom: '1rem' }}>
            Customer Love
          </h1>
          <p style={{ color: '#5A5551', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
            Hear what our customers are saying about their everlasting blooms.
          </p>
          
          {reviews.length > 0 && (
            <div style={{ marginTop: '2rem', display: 'inline-flex', alignItems: 'center', gap: '1rem', backgroundColor: '#FDFBF7', padding: '1rem 2rem', borderRadius: '50px', border: '1px solid #EAE6DF' }}>
              <div style={{ display: 'flex', gap: '0.25rem', color: '#F59E0B', fontSize: '1.5rem' }}>
                ★★★★★
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: 600, color: '#3A3531' }}>{avgRating} / 5.0</span>
              <span style={{ color: '#7A7571' }}>({reviews.length} reviews)</span>
            </div>
          )}
        </header>

        {reviews.length > 0 ? (
          <div style={{ columnCount: 3, columnGap: '2rem' }}>
            {reviews.map((r) => (
              <div key={r.id} style={{ breakInside: 'avoid', marginBottom: '2rem', backgroundColor: '#FDFBF7', padding: '2rem', borderRadius: '16px', border: '1px solid #EAE6DF' }}>
                <div style={{ display: 'flex', gap: '0.25rem', color: '#F59E0B', marginBottom: '1rem', fontSize: '1.2rem' }}>
                  {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#3A3531', marginBottom: '1rem' }}>
                  "{r.title || r.content.substring(0, 30) + '...'}"
                </h3>
                <p style={{ color: '#5A5551', fontSize: '1rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  {r.content}
                </p>
                <div style={{ borderTop: '1px solid #EAE6DF', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong style={{ display: 'block', color: '#3A3531', marginBottom: '0.25rem' }}>{r.authorName}</strong>
                    <span style={{ color: '#9A9591', fontSize: '0.85rem' }}>{new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(r.createdAt))}</span>
                  </div>
                  <Link href={`/shop/${r.productId}`} style={{ color: 'var(--brand-primary)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500, borderBottom: '1px solid currentColor' }}>
                    View Product
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem', backgroundColor: '#FDFBF7', borderRadius: '16px', border: '1px solid #EAE6DF' }}>
            <p style={{ color: '#7A7571', fontSize: '1.1rem' }}>We don't have any reviews to show yet.</p>
            <Link href="/shop" style={{ display: 'inline-block', marginTop: '1.5rem', color: 'var(--brand-primary)', textDecoration: 'none', fontWeight: 500, borderBottom: '1px solid currentColor' }}>
              Shop our collections
            </Link>
          </div>
        )}

      </div>
    </main>
  );
}
