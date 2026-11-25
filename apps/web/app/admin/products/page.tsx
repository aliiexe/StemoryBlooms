import { assertAdmin } from '@/lib/user-sync';
import React from 'react';
import Link from 'next/link';
import { db } from '@stemory/database';
import styles from '../dashboard.module.css';
import {Plus} from 'lucide-react';
import { AdminProductsClient } from './AdminProductsClient';

export default async function AdminProductsPage() {
  await assertAdmin();
  const [products,settings]=await Promise.all([db.query.product.findMany({orderBy:(product,{desc})=>[desc(product.createdAt)]}),db.query.siteSettings.findFirst()]);
  const trackInventory=(settings?.config as {inventoryTrackingEnabled?:boolean}|null)?.inventoryTrackingEnabled!==false;
  return <div className={styles.dashboard}><header className={styles.pageHeader}><div><h1 className={styles.pageTitle}>Products</h1><p>Your bouquets, their prices, and what’s available to order.</p></div><Link href="/admin/products/new" className={styles.primaryAction}><Plus size={16}/>Add product</Link></header><AdminProductsClient initialProducts={products} trackInventory={trackInventory}/></div>;
}
