'use server';

import { db, eq, and, deliveryZone } from '@stemory/database';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { assertAdmin } from '@/lib/user-sync';

export async function saveDeliveryZone(formData: FormData) {
  await assertAdmin();
  const id = formData.get('id') as string;
  const name = (formData.get('name') as string)?.trim();
  const rawFee = formData.get('fee');
  const fee = typeof rawFee === 'string' && /^\d+$/.test(rawFee) ? Number(rawFee) : NaN;
  const deliveryTime = (formData.get('deliveryTime') as string)?.trim() || null;
  const isActive = formData.get('isActive') === 'on';

  if (!name || name.length > 100 || !Number.isSafeInteger(fee) || fee < 0 || fee > 100000 || (deliveryTime?.length || 0) > 150) return { error: 'Enter a city name and a whole delivery price between 0 and 100,000 MAD.' };

  try {
    if (id) {
      const expected = formData.get('expectedUpdatedAt');
      if (typeof expected !== 'string' || !Number.isFinite(Date.parse(expected))) return { error: 'Reload this city before saving.' };
      const changed = await db.update(deliveryZone)
        .set({ name, fee, deliveryTime, isActive, updatedAt: new Date() })
        .where(and(eq(deliveryZone.id, id), eq(deliveryZone.updatedAt, new Date(expected)))).returning({ id: deliveryZone.id });
      if (!changed.length) return { error: 'This city changed in another window. Reload before editing.' };
    } else {
      await db.insert(deliveryZone).values({
        id: crypto.randomUUID(),
        name, fee, deliveryTime, isActive,
        updatedAt: new Date(),
      });
    }
    revalidatePath('/admin/deliveries/zones');
    revalidatePath('/admin/orders/new');
    revalidatePath('/checkout');
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: 'Failed to save zone. Name must be unique.' };
  }
}

export async function deleteDeliveryZone(id: string) {
  await assertAdmin();
  try {
    await db.update(deliveryZone).set({ isActive: false, updatedAt: new Date() }).where(eq(deliveryZone.id, id));
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
