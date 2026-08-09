'use server';

import { db, eq, order } from '@stemory/database';
import { revalidatePath } from 'next/cache';

export async function updateOrderStatus(orderId: string, status: string) {
  await db.update(order).set({ status, updatedAt: new Date() }).where(eq(order.id, orderId));
  revalidatePath('/admin/orders');
}
