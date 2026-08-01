export const dynamic = 'force-dynamic';

import styles from './page.module.css';
import { ProductCard } from '@stemory/ui';
import { prisma } from '@stemory/database';



export default async function ShopPage() {
  let products: any[] = [];

  try {
    const dbProducts = await prisma.product.findMany();
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
      <header className={styles.shopHeader}>
        <h1 className={styles.shopTitle}>Shop All Bouquets</h1>
        <p className={styles.shopSubtitle}>Explore our collection of luxury handcrafted pipe-cleaner flowers</p>
      </header>

      <div className={styles.productGrid}>
        {products.map(product => (
          <ProductCard key={product.id} title={product.name} price={product.price} />
        ))}
      </div>

      {products.length === 0 && (
        <div style={{ padding: '6rem 2rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-editorial)', fontSize: '2rem', color: '#3A3531', marginBottom: '1rem' }}>
            Our Catalog is Currently Empty
          </h2>
          <p style={{ color: '#7A7571', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            We've sold out of our latest collection! Our master florists are busy hand-crafting 
            new everlasting arrangements. Join our waitlist to be notified when they drop.
          </p>
        </div>
      )}
    </main>
  );
}
