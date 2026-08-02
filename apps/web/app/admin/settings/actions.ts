'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@stemory/database';

export async function setSiteMode(mode: 'WAITLIST' | 'LIVE' | 'MAINTENANCE' | 'DRAFT') {
  const existing = await prisma.siteSettings.findFirst();
  if (existing) {
    await prisma.siteSettings.update({ where: { id: existing.id }, data: { mode } });
  } else {
    await prisma.siteSettings.create({ data: { mode } });
  }
  revalidatePath('/admin/settings');
  revalidatePath('/');
}
