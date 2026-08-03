'use server';

import { prisma } from '@stemory/database';
import { revalidatePath } from 'next/cache';

export async function savePromoCode(formData: FormData) {
  const id = formData.get('id') as string;
  const code = formData.get('code') as string;
  const type = formData.get('type') as string;
  const value = parseInt(formData.get('value') as string, 10);
  const usageLimitStr = formData.get('usageLimit') as string;
  const usageLimit = usageLimitStr ? parseInt(usageLimitStr, 10) : null;
  const isActive = formData.get('isActive') === 'on';

  if (!code || isNaN(value)) {
    return { error: 'Code and valid value are required' };
  }

  try {
    if (id) {
      await prisma.promoCode.update({
        where: { id },
        data: { code: code.toUpperCase(), type, value, usageLimit, isActive }
      });
    } else {
      await prisma.promoCode.create({
        data: { code: code.toUpperCase(), type, value, usageLimit, isActive }
      });
    }
    
    revalidatePath('/admin/promotions');
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: 'Failed to save promo code. Make sure the code is unique.' };
  }
}

export async function deletePromoCode(id: string) {
  try {
    await prisma.promoCode.delete({ where: { id } });
    revalidatePath('/admin/promotions');
    return { success: true };
  } catch (err) {
    return { error: 'Failed to delete promo code' };
  }
}

export async function saveGiftCard(formData: FormData) {
  const id = formData.get('id') as string;
  const code = formData.get('code') as string;
  const initialBalance = parseInt(formData.get('initialBalance') as string, 10);
  const currentBalanceStr = formData.get('currentBalance') as string;
  const currentBalance = currentBalanceStr ? parseInt(currentBalanceStr, 10) : initialBalance;
  const isActive = formData.get('isActive') === 'on';

  if (!code || isNaN(initialBalance)) {
    return { error: 'Code and valid balance are required' };
  }

  try {
    if (id) {
      await prisma.giftCard.update({
        where: { id },
        data: { code: code.toUpperCase(), initialBalance, currentBalance, isActive }
      });
    } else {
      await prisma.giftCard.create({
        data: { code: code.toUpperCase(), initialBalance, currentBalance, isActive }
      });
    }
    
    revalidatePath('/admin/promotions');
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: 'Failed to save gift card. Make sure the code is unique.' };
  }
}

export async function deleteGiftCard(id: string) {
  try {
    await prisma.giftCard.delete({ where: { id } });
    revalidatePath('/admin/promotions');
    return { success: true };
  } catch (err) {
    return { error: 'Failed to delete gift card' };
  }
}
