export const dynamic = 'force-dynamic';

import styles from './page.module.css';
import { ProductCard } from '@stemory/ui';
import { prisma } from '@stemory/database';
import Link from 'next/link';

export default async function ShopPage() {
  let products: any[] = [];

  try {
    const dbProducts = await prisma.product.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' }
    });
    
    if (dbProducts && dbProducts.length > 0) {
      products = dbProducts.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.basePrice
      }));
    }
  } catch (error) {
    console.error('Failed to fetch products:', error);
  }

  return (
    <main className={styles.shopContainer}>
      {/* Decorative Background Blob */}
      <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '40vw', height: '40vw', backgroundColor: '#EAE6DF', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.5, zIndex: 0 }} />

      <header className={styles.shopHeader}>
        <h1 className={styles.shopTitle}>The Collection</h1>
        <p className={styles.shopSubtitle}>
          Explore our signature series of luxury handcrafted everlasting arrangements, meticulously designed to bring enduring beauty to any space.
        </p>
      </header>

      {products.length > 0 ? (
        <div className={styles.productGrid}>
          {products.map(product => (
            <ProductCard key={product.id} id={product.id} title={product.name} price={product.price} />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>
            Our Catalog is Currently Empty
          </h2>
          <p className={styles.emptyDesc}>
            We've sold out of our latest collection! Our master florists are busy hand-crafting 
            new everlasting arrangements. Join our waitlist to be notified when they drop.
          </p>
          <Link href="/waitlist" style={{ display: 'inline-block', marginTop: '2rem', padding: '1rem 2.5rem', backgroundColor: 'var(--brand-primary)', color: '#FDFBF7', textDecoration: 'none', borderRadius: '50px', fontWeight: 500 }}>
            Join the Waitlist
          </Link>
        </div>
      )}
    </main>
  );
}
