'use server';
import { savePromoCode } from '../promotions/actions';

import { db, eq, promoCode } from '@stemory/database';
import { revalidatePath } from 'next/cache';
import { assertAdmin } from '@/lib/user-sync';

export async function saveContentBlock(_formData: FormData) {
  await assertAdmin();
  void _formData;
  return { error: 'Use the connected website text editor to save and publish supported page content.' };
}
export async function deleteContentBlock(_id: string) {
  await assertAdmin();
  void _id;
  return { error: 'Generic content deletion is disabled. Preserve existing content and use the connected editor.' };
}

export async function createPromoCode(formData: FormData) {
  await assertAdmin();
  return savePromoCode(formData);
}

export async function togglePromoCode(id: string, isActive: boolean) {
  await assertAdmin();
  if (typeof isActive !== 'boolean') return { error: 'Choose a valid promotion state.' };
  try {
    await db.update(promoCode).set({ isActive, updatedAt: new Date() }).where(eq(promoCode.id, id));
    revalidatePath('/admin/content');
    return { success: true };
  } catch {
    return { error: 'Failed to update promo code' };
  }
}

export async function deletePromoCode(id: string) {
  await assertAdmin();
  try {
    await db.update(promoCode).set({ isActive: false, updatedAt: new Date() }).where(eq(promoCode.id, id));
    revalidatePath('/admin/content');
    return { success: true };
  } catch {
    return { error: 'Failed to delete promo code' };
  }
}
