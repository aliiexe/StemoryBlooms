'use server';

import { db } from '@stemory/database';
import { promoCode } from '@stemory/database/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function createPromoCode(formData: FormData) {
  const code = formData.get('code') as string;
  const type = formData.get('type') as string;
  const value = parseInt(formData.get('value') as string, 10);
  const usageLimitStr = formData.get('usageLimit') as string;
  
  if (!code || !type || isNaN(value)) {
    return { error: 'Missing required fields' };
  }

  const usageLimit = usageLimitStr ? parseInt(usageLimitStr, 10) : null;

  try {
    await db.insert(promoCode).values({
        id: crypto.randomUUID(),
        updatedAt: new Date(),
        code: code.toUpperCase().trim(),
        type,
        value,
        usageLimit
    });
    revalidatePath('/admin/content');
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: 'Promo code already exists' };
    }
    return { error: 'Failed to create promo code' };
  }
}

export async function togglePromoCode(id: string, isActive: boolean) {
  try {
    await db.update(promoCode).set({ isActive, updatedAt: new Date() }).where(eq(promoCode.id, id));
    revalidatePath('/admin/content');
    return { success: true };
  } catch (error) {
    return { error: 'Failed to update promo code' };
  }
}

export async function deletePromoCode(id: string) {
  try {
    await db.delete(promoCode).where(eq(promoCode.id, id));
    revalidatePath('/admin/content');
    return { success: true };
  } catch (error) {
    return { error: 'Failed to delete promo code' };
  }
}
