import { assertAdmin } from '@/lib/user-sync';
import React from 'react';
import { db, category } from '@stemory/database';
import { asc } from 'drizzle-orm';
import styles from '../dashboard.module.css';
import { CategoriesClient } from './CategoriesClient';

export default async function AdminCategoriesPage() {
  await assertAdmin();
  const categories = await db.query.category.findMany({
    orderBy: [asc(category.name)],
  });

  return <div className={styles.dashboard}><header className={styles.pageHeader}><div><h1 className={styles.pageTitle}>Categories</h1><p>Help customers find the right products with clear collection labels.</p></div></header><CategoriesClient initialCategories={categories}/></div>;
}
