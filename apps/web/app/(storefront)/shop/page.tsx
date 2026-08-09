export const dynamic = 'force-dynamic';

import styles from './page.module.css';
import { ProductCard } from '@stemory/ui';
import { db } from '@stemory/database';
import Link from 'next/link';

type ShopProduct = {
  id: string;
  name: string;
  price: number;
  salePrice?: number | null;
  imageUrl: string;
  description: string;
};

export default async function ShopPage({ searchParams }: { searchParams?: Promise<{ search?: string | string[] }> }) {
  let products: ShopProduct[] = [];
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const searchTerm = Array.isArray(resolvedSearchParams?.search)
    ? resolvedSearchParams.search[0]
    : resolvedSearchParams?.search || '';
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  try {
    const dbProducts = await db.query.product.findMany({
      where: (products, { eq }) => eq(products.status, 'PUBLISHED'),
      orderBy: (products, { desc }) => [desc(products.createdAt)]
    });
    
    if (dbProducts && dbProducts.length > 0) {
      products = dbProducts.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.basePrice,
        salePrice: p.isSaleEnabled ? p.salePrice : null,
        imageUrl: p.images?.[0] || '/hero-bouquet.png',
        description: p.description || ''
      }));

      if (normalizedSearchTerm) {
        products = products.filter((product) =>
          [product.name, product.description]
            .join(' ')
            .toLowerCase()
            .includes(normalizedSearchTerm)
        );
      }
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
        {normalizedSearchTerm && (
          <div className={styles.searchSummary}>
            <span className={styles.searchPill}>Searching for “{searchTerm}”</span>
            <Link href="/shop" className={styles.clearSearchLink}>Clear search</Link>
          </div>
        )}
      </header>

      {products.length > 0 ? (
        <div className={styles.productGrid}>
          {products.map(product => (
            <ProductCard key={product.id} id={product.id} title={product.name} price={product.price} salePrice={product.salePrice} imageUrl={product.imageUrl} />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>
            Our Catalog is Currently Empty
          </h2>
          <p className={styles.emptyDesc}>
            We&apos;ve sold out of our latest collection! Our master florists are busy hand-crafting 
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
