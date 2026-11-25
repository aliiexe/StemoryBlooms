import Link from 'next/link';
import { db, product, builderComponent, asc } from '@stemory/database';
import { assertAdmin } from '@/lib/user-sync';
import { inventorySchemaReady } from '@/lib/commerce/stock-ledger';
import ProductionClient from './ProductionClient';
import styles from '../dashboard.module.css';
export default async function ProductionPage({ searchParams }: { searchParams: Promise<{ kind?: string; id?: string }> }) {
  await assertAdmin();
  const [filters, products, components, ready] = await Promise.all([searchParams,
    db.select({ id: product.id, name: product.name, stock: product.stock }).from(product).orderBy(asc(product.name)),
    db.select({ id: builderComponent.id, name: builderComponent.name, stock: builderComponent.stock }).from(builderComponent).orderBy(asc(builderComponent.name)), inventorySchemaReady()]);
  return <div className={styles.dashboard}><header className={styles.pageHeader}><div><h1 className={styles.pageTitle}>Production</h1><p>Make components from raw materials, then assemble products from finished components and direct materials.</p></div><Link href="/admin/inventory/movements">Movement history</Link></header>
    <p>Stock operations preserve catalog availability. Enable an item in Products or Custom Builder when it is ready to offer.</p>
    {!ready && <p role="status">Apply the inventory migration to enable recording. You can preview existing recipes below.</p>}
    <ProductionClient products={products} components={components} ready={ready} initialKind={filters.kind === 'COMPONENT' ? 'COMPONENT' : 'PRODUCT'} initialId={filters.id || ''} />
  </div>;
}
