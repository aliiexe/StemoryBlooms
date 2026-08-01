export const dynamic = 'force-dynamic';

import styles from './page.module.css';
import { ProductCard } from '@stemory/ui';

const FALLBACK_PRODUCTS = [
  { id: '1', name: 'Classic Lavender Bunch', price: 150 },
  { id: '2', name: 'Signature Pink Tulip', price: 200 },
  { id: '3', name: 'Sunshine Daisy Mix', price: 180 },
  { id: '4', name: 'Mini Rose Bouquet', price: 120 },
];

export default async function ShopPage() {
  let products = FALLBACK_PRODUCTS;

  try {
    const res = await fetch('http://127.0.0.1:3001/api/v1/products', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        products = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: p.basePrice ? p.basePrice / 100 : p.price || 0,
        }));
      }
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
    </main>
  );
}
