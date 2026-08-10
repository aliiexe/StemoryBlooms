'use server';

import { revalidatePath } from 'next/cache';
import { db, eq, siteSettings, deliveryCompany } from '@stemory/database';
import crypto from 'crypto';
import { parseIntegerInput } from '../../../lib/form-values';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

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

async function storeUploadedImages(uploadedFiles: File[]) {
  const uploadDir = path.resolve(process.cwd(), 'public/uploads');
  await mkdir(uploadDir, { recursive: true });

  const imageUrls: string[] = [];

  for (const file of uploadedFiles) {
    const safeName = file.name
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9._-]/g, '')
      .toLowerCase();
    const extension = path.extname(safeName) || '.jpg';
    const baseName = path.basename(safeName, extension) || 'upload';
    const fileName = `${Date.now()}-${crypto.randomUUID()}-${baseName}${extension}`;
    const filePath = path.join(uploadDir, fileName);
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, bytes);
    imageUrls.push(`/uploads/${fileName}`);
  }

  return imageUrls;
}

export async function saveHeroSettings(formData: FormData) {
  const imagesStr = formData.get('images') as string;
  let images: string[] = [];
  try {
    if (imagesStr) images = JSON.parse(imagesStr);
  } catch (e) {
    console.error('Failed to parse images json', e);
  }

  const uploadedFiles = formData.getAll('newImages').filter((value): value is File => value instanceof File);
  const uploadedImageUrls = uploadedFiles.length > 0 ? await storeUploadedImages(uploadedFiles) : [];
  const allImages = [...images, ...uploadedImageUrls];

  const fadeSpeed = parseIntegerInput(formData.get('fadeSpeed') as string | null) ?? 5;

  const existing = await db.query.siteSettings.findFirst();
  const config = existing?.config as Record<string, any> | null || {};
  config.heroImages = allImages;
  config.heroFadeSpeed = fadeSpeed;

  if (existing) {
    await db.update(siteSettings).set({ config, updatedAt: new Date() }).where(eq(siteSettings.id, existing.id));
  } else {
    await db.insert(siteSettings).values({ id: crypto.randomUUID(), config, updatedAt: new Date() });
  }

  revalidatePath('/admin/settings');
  revalidatePath('/');
  return { success: true };
}

export async function saveBuilderSections(sections: Record<string, boolean>) {
  const existing = await db.query.siteSettings.findFirst();
  const config = existing?.config as Record<string, any> | null || {};
  config.builderSections = sections;

  if (existing) {
    await db.update(siteSettings).set({ config, updatedAt: new Date() }).where(eq(siteSettings.id, existing.id));
  } else {
    await db.insert(siteSettings).values({ id: crypto.randomUUID(), config, updatedAt: new Date() });
  }

  revalidatePath('/admin/builder');
  revalidatePath('/custom-bouquet');
  return { success: true };
}
