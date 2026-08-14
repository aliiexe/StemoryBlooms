'use server';

import { db, eq, order } from '@stemory/database';
import { revalidatePath } from 'next/cache';
import { assertAdmin } from '../../../lib/user-sync';

export async function updateOrderStatus(orderId: string, status: string) {
  await assertAdmin();
  await db.update(order).set({ status, updatedAt: new Date() }).where(eq(order.id, orderId));
  revalidatePath('/admin/orders');
}
