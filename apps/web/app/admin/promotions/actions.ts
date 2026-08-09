'use server';

import { db, eq, promoCode, giftCard } from '@stemory/database';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { parseIntegerInput } from '../../../lib/form-values';

export async function savePromoCode(formData: FormData) {
  const id = formData.get('id') as string;
  const code = formData.get('code') as string;
  const type = formData.get('type') as string;
  const value = parseIntegerInput(formData.get('value') as string | null);
  const usageLimitStr = formData.get('usageLimit') as string;
  const usageLimit = usageLimitStr ? parseIntegerInput(usageLimitStr) : null;
  const isActive = formData.get('isActive') === 'on';

  if (!code || value === null) {
    return { error: 'Code and valid value are required' };
  }

  try {
    if (id) {
      await db.update(promoCode)
        .set({ code: code.toUpperCase(), type, value, usageLimit, isActive, updatedAt: new Date() })
        .where(eq(promoCode.id, id));
    } else {
      await db.insert(promoCode).values({
        id: crypto.randomUUID(),
        code: code.toUpperCase(), type, value, usageLimit, isActive, updatedAt: new Date()
      });
    }
    
    revalidatePath('/admin/content');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to save promo code. Make sure the code is unique.' };
  }
}

export async function deletePromoCode(id: string) {
  try {
    await db.delete(promoCode).where(eq(promoCode.id, id));
    revalidatePath('/admin/content');
    return { success: true };
  } catch {
    return { error: 'Failed to delete promo code' };
  }
}

export async function saveGiftCard(formData: FormData) {
  const id = formData.get('id') as string;
  const code = formData.get('code') as string;
  const initialBalance = parseIntegerInput(formData.get('initialBalance') as string | null);
  const currentBalanceStr = formData.get('currentBalance') as string;
  const currentBalance = currentBalanceStr ? parseIntegerInput(currentBalanceStr) : initialBalance;
  const isActive = formData.get('isActive') === 'on';

  if (!code || initialBalance === null || currentBalance === null) {
    return { error: 'Code and valid balance are required' };
  }

  try {
    if (id) {
      await db.update(giftCard)
        .set({ code: code.toUpperCase(), initialBalance, currentBalance, isActive, updatedAt: new Date() })
        .where(eq(giftCard.id, id));
    } else {
      await db.insert(giftCard).values({
        id: crypto.randomUUID(),
        code: code.toUpperCase(), initialBalance, currentBalance, isActive, updatedAt: new Date()
      });
    }
    
    revalidatePath('/admin/content');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to save gift card. Make sure the code is unique.' };
  }
}

export async function deleteGiftCard(id: string) {
  try {
    await db.delete(giftCard).where(eq(giftCard.id, id));
    revalidatePath('/admin/promotions');
    return { success: true };
  } catch {
    return { error: 'Failed to delete gift card' };
  }
}
