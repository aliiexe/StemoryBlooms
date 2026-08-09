'use server';

import { db, eq, sql, promoCode, contentBlock } from '@stemory/database';
import { asc, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { parseIntegerInput } from '../../../lib/form-values';

export async function saveContentBlock(formData: FormData) {
  const id = formData.get('id') as string;
  const identifier = formData.get('identifier') as string;
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const type = formData.get('type') as string;
  const isActive = formData.get('isActive') === 'on';

  if (!identifier) {
    return { error: 'Identifier is required' };
  }

  try {
    const payload = { title, content, type, isActive };
    if (id) {
      await db.update(contentBlock).set({ key: identifier, content: payload, updatedAt: new Date() }).where(eq(contentBlock.id, id));
    } else {
      await db.insert(contentBlock).values({ id: crypto.randomUUID(), key: identifier, content: payload, updatedAt: new Date() });
    }
    
    revalidatePath('/admin/content');
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: 'Failed to save content. Make sure the identifier is unique.' };
  }
}

export async function deleteContentBlock(id: string) {
  try {
    await db.delete(contentBlock).where(eq(contentBlock.id, id));
    revalidatePath('/admin/content');
    return { success: true };
  } catch (err) {
    return { error: 'Failed to delete content' };
  }
}

export async function createPromoCode(formData: FormData) {
  const code = formData.get('code') as string;
  const type = formData.get('type') as string;
  const value = parseIntegerInput(formData.get('value') as string | null);
  const usageLimitStr = formData.get('usageLimit') as string;
  
  if (!code || !type || value === null) {
    return { error: 'Missing required fields' };
  }

  const usageLimit = usageLimitStr ? parseIntegerInput(usageLimitStr) : null;

  try {
    await db.insert(promoCode).values({
      id: crypto.randomUUID(),
      code: code.toUpperCase().trim(),
      type,
      value,
      usageLimit,
      updatedAt: new Date()
    });
    revalidatePath('/admin/content');
    return { success: true };
  } catch (error: any) {
    if (error.code === '23505') {
      return { error: 'Promo code already exists' };
    }
    return { error: 'Failed to create promo code' };
  }
}

export async function togglePromoCode(id: string, isActive: boolean) {
  try {
    await db.update(promoCode).set({ isActive }).where(eq(promoCode.id, id));
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
