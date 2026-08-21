'use server';

import { db, eq, deliveryZone } from '@stemory/database';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { assertAdmin } from '@/lib/user-sync';

export async function saveDeliveryZone(formData: FormData) {
  await assertAdmin();
  const id = formData.get('id') as string;
  const name = (formData.get('name') as string)?.trim();
  const fee = parseInt(formData.get('fee') as string, 10);
  const deliveryTime = (formData.get('deliveryTime') as string)?.trim() || null;
  const isActive = formData.get('isActive') === 'on';

  if (!name || isNaN(fee)) return { error: 'Name and fee are required' };

  try {
    if (id) {
      await db.update(deliveryZone)
        .set({ name, fee, deliveryTime, isActive, updatedAt: new Date() })
        .where(eq(deliveryZone.id, id));
    } else {
      await db.insert(deliveryZone).values({
        id: crypto.randomUUID(),
        name, fee, deliveryTime, isActive,
        updatedAt: new Date(),
      });
    }
    revalidatePath('/admin/deliveries/zones');
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: 'Failed to save zone. Name must be unique.' };
  }
}

export async function deleteDeliveryZone(id: string) {
  await assertAdmin();
  try {
    await db.delete(deliveryZone).where(eq(deliveryZone.id, id));
    revalidatePath('/admin/deliveries/zones');
    return { success: true };
  } catch {
    return { error: 'Failed to delete zone' };
  }
}

export async function toggleDeliveryZone(id: string, isActive: boolean) {
  await assertAdmin();
  await db.update(deliveryZone).set({ isActive, updatedAt: new Date() }).where(eq(deliveryZone.id, id));
  revalidatePath('/admin/deliveries/zones');
}
