'use client';
import type {category} from '@stemory/database';
import {AdminCategoriesClient} from './AdminCategoriesClient';
export function CategoriesClient({initialCategories}:{initialCategories:(typeof category.$inferSelect)[]}){return <AdminCategoriesClient initialCategories={initialCategories} categoryIdeas={[]}/>;}
