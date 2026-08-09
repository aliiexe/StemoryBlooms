'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@stemory/database';
import { siteSettings } from '@stemory/database/schema';
import { eq } from 'drizzle-orm';

export async function setSiteMode(mode: 'WAITLIST' | 'LIVE' | 'MAINTENANCE' | 'DRAFT') {
  const existing = await db.query.siteSettings.findFirst();
  if (existing) {
    await db.update(siteSettings).set({ mode, updatedAt: new Date() }).where(eq(siteSettings.id, existing.id));
  } else {
    await db.insert(siteSettings).values({ id: crypto.randomUUID(), mode, updatedAt: new Date() });
  }
  revalidatePath('/admin/settings');
  revalidatePath('/');
}
