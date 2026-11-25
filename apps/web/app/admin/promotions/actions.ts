'use server';

import { db, eq, promoCode, giftCard } from '@stemory/database';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { recordAuditLog } from '@/lib/audit';
import { assertAdmin } from '@/lib/user-sync';

export async function savePromoCode(formData: FormData) {
  await assertAdmin();
  const id = formData.get('id') as string;
  const code = formData.get('code') as string;
  const type = formData.get('type') as string;
  const value = Number(formData.get('value'));
  const usageLimitStr = formData.get('usageLimit') as string;
  const usageLimit = usageLimitStr ? Number(usageLimitStr) : null;
  const isActive = formData.get('isActive') === 'on';

  if (!code?.trim() || !/^[A-Za-z0-9_-]{3,64}$/.test(code.trim()) || !Number.isSafeInteger(value) || value < 0 || value > 1000000 || !['PERCENTAGE', 'FIXED'].includes(type) || (type === 'PERCENTAGE' && value > 100) || (usageLimit !== null && (!Number.isSafeInteger(usageLimit) || usageLimit < 1 || usageLimit>1000000))) {
    return { error: 'Code and valid value are required' };
  }

  try {
    if (id) {
      await db.update(promoCode)
        .set({ code: code.trim().toUpperCase(), type, value, usageLimit, isActive, updatedAt: new Date() })
        .where(eq(promoCode.id, id));
    } else {
      await db.insert(promoCode).values({
        id: crypto.randomUUID(),
        code: code.trim().toUpperCase(), type, value, usageLimit, isActive, updatedAt: new Date()
      });
    }

    revalidatePath('/admin/content');
    await recordAuditLog({
      action: id ? 'UPDATE' : 'CREATE',
      target: 'PROMO_CODE',
      summary: `${id ? 'Updated' : 'Created'} promo code "${code.toUpperCase()}"`,
      details: { promoCodeId: id, code, type, value },
    });
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to save promo code. Make sure the code is unique.' };
  }
}

export async function deletePromoCode(id: string) {
  await assertAdmin();
  try {
    await db.update(promoCode).set({ isActive: false, updatedAt: new Date() }).where(eq(promoCode.id, id));
    revalidatePath('/admin/content');
    await recordAuditLog({
      action: 'DELETE',
      target: 'PROMO_CODE',
      summary: `Deleted promo code`,
      details: { promoCodeId: id },
    });
    return { success: true };
  } catch {
    return { error: 'Failed to delete promo code' };
  }
}

export async function saveGiftCard(formData: FormData) {
  await assertAdmin();
  const id = formData.get('id') as string;
  const code = formData.get('code') as string;
  const initialBalance = Number(formData.get('initialBalance'));
  const currentBalanceStr = formData.get('currentBalance') as string;
  const currentBalance = currentBalanceStr ? Number(currentBalanceStr) : initialBalance;
  const isActive = formData.get('isActive') === 'on';

  if (!code?.trim() || !/^[A-Za-z0-9_-]{3,64}$/.test(code.trim()) || !Number.isSafeInteger(initialBalance) || initialBalance>1000000 || !Number.isSafeInteger(currentBalance) || initialBalance <= 0 || currentBalance < 0 || currentBalance > initialBalance) {
    return { error: 'Code and valid balance are required' };
  }

  let savedBalance=currentBalance;
  try {
    if (id) {
      const existing = await db.query.giftCard.findFirst({ where: eq(giftCard.id, id) });
      if (!existing || initialBalance !== existing.initialBalance) return { error: 'An issued card’s value cannot be changed. Create a new card instead.' };
      savedBalance=existing.currentBalance;
      await db.update(giftCard)
        .set({ code: code.trim().toUpperCase(), isActive, updatedAt: new Date() })
        .where(eq(giftCard.id, id));
    } else {
      await db.insert(giftCard).values({
        id: crypto.randomUUID(),
        code: code.trim().toUpperCase(), initialBalance, currentBalance, isActive, updatedAt: new Date()
      });
    }

    revalidatePath('/admin/content');
    await recordAuditLog({
      action: id ? 'UPDATE' : 'CREATE',
      target: 'GIFT_CARD',
      summary: `${id ? 'Updated' : 'Created'} gift card "${code.toUpperCase()}"`,
      details: { giftCardId: id, code, initialBalance, currentBalance:savedBalance },
    });
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to save gift card. Make sure the code is unique.' };
  }
}

export async function deleteGiftCard(id: string) {
  await assertAdmin();
  try {
    await db.update(giftCard).set({ isActive: false, updatedAt: new Date() }).where(eq(giftCard.id, id));
    revalidatePath('/admin/content');
    await recordAuditLog({
      action: 'DELETE',
      target: 'GIFT_CARD',
      summary: `Deleted gift card`,
      details: { giftCardId: id },
    });
    return { success: true };
  } catch {
    return { error: 'Failed to delete gift card' };
  }
}
