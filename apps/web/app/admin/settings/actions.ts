'use server';

import { revalidatePath } from 'next/cache';
import { db, eq, siteSettings, deliveryCompany } from '@stemory/database';
import crypto from 'crypto';
import { parseIntegerInput } from '../../../lib/form-values';

export async function setSiteMode(mode: 'WAITLIST' | 'LIVE' | 'MAINTENANCE' | 'DRAFT') {
  const existing = await db.query.siteSettings.findFirst();
  if (existing) {
    await db.update(siteSettings).set({ mode, updatedAt: new Date() }).where(eq(siteSettings.id, existing.id));
  } else {
    await db.insert(siteSettings).values({ id: crypto.randomUUID(), mode, updatedAt: new Date() });
  }
  revalidatePath('/admin/settings');
  revalidatePath('/');
  return { success: true };
}

export async function saveDeliveryCompany(formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const contact = formData.get('contact') as string;
  const email = formData.get('email') as string;
  const fee = parseIntegerInput(formData.get('fee') as string | null);
  const isActive = formData.get('isActive') === 'on';

  if (!name?.trim() || fee === null) {
    return { error: 'Company name and fee are required' };
  }

  try {
    if (id) {
      await db.update(deliveryCompany).set({ name, contact, email, fee, isActive, }).where(eq(deliveryCompany.id, id));
    } else {
      await db.insert(deliveryCompany).values({ id: crypto.randomUUID(), name, contact, email, fee, isActive });
    }

    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to save delivery company' };
  }
}

export async function deleteDeliveryCompany(id: string) {
  try {
    await db.delete(deliveryCompany).where(eq(deliveryCompany.id, id));
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to delete delivery company' };
  }
}
