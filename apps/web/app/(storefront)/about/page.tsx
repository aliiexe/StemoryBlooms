import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <main style={{ backgroundColor: 'var(--surface-primary)', minHeight: '100vh', overflow: 'hidden' }}>
      
      {/* Hero Section */}
      <section style={{ backgroundColor: 'var(--brand-primary)', color: '#FDFBF7', padding: '8rem 2rem', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-editorial)', fontSize: '4rem', marginBottom: '1.5rem', fontWeight: 400 }}>
          Our Story
        </h1>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6, color: '#EAE6DF' }}>
          Crafting eternal beauty from unexpected materials. Stemory Blooms was born from a desire to make moments last forever.
        </p>
      </section>

      {/* Content Section */}
      <section style={{ padding: '6rem 2rem', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>
          
          <div style={{ position: 'relative', width: '100%', aspectRatio: '4/5', borderRadius: '24px', overflow: 'hidden' }}>
            <Image src="/hero-bouquet.png" alt="Artisan crafting a bouquet" fill style={{ objectFit: 'cover' }} />
          </div>
          
          <div>
            <h2 style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.5rem', color: 'var(--brand-primary)', marginBottom: '2rem' }}>
              The Art of Everlasting Blooms
            </h2>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: '1.1rem', color: '#5A5551', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <p>
                In a world where everything is fleeting, we wanted to create something that endures. Real flowers wilt and fade, taking their memories with them. We believe that the symbol of your love, appreciation, or celebration should last as long as the memory itself.
              </p>
              <p>
                That's why we turned to pipe cleaners—a humble material transformed through hours of meticulous hand-crafting into luxurious, velvet-like floral arrangements. Every petal is shaped by hand in our Moroccan studio, ensuring no two blooms are exactly alike.
              </p>
              <p>
                Stemory Blooms is more than a florist. We are memory keepers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section style={{ backgroundColor: '#EAE6DF', padding: '6rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.5rem', color: 'var(--brand-primary)', marginBottom: '2rem' }}>
            Our Promise
          </h2>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '1.1rem', color: '#5A5551', lineHeight: 1.8, marginBottom: '3rem' }}>
            We promise to deliver art that speaks to the heart. Whether you are ordering from our curated collection or building a custom bouquet, our artisans pour their soul into every twist and turn of the stem. We are committed to sustainability, artistry, and the eternal bloom.
          </p>
          <Link href="/shop" style={{ 
            display: 'inline-block', 
            padding: '1rem 2.5rem', 
            backgroundColor: 'var(--brand-primary)', 
            color: '#FDFBF7', 
            textDecoration: 'none', 
            borderRadius: '50px', 
            fontWeight: 500,
            transition: 'background-color 0.2s ease'
          }}>
            Explore the Collection
          </Link>
        </div>
      </section>

    </main>
  );
}
