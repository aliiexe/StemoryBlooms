'use server';

import { revalidatePath } from 'next/cache';
import { db, eq, builderComponent } from '@stemory/database';
import crypto from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { parseIntegerInput } from '../../../lib/form-values';

async function storeUploadedImage(file: File): Promise<string> {
  const uploadDir = path.join(process.cwd(), 'public/uploads');
  await mkdir(uploadDir, { recursive: true });
  const safeName = file.name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase();
  const ext = path.extname(safeName) || '.jpg';
  const base = path.basename(safeName, ext) || 'upload';
  const fileName = `${Date.now()}-${crypto.randomUUID()}-${base}${ext}`;
  await writeFile(path.join(uploadDir, fileName), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${fileName}`;
}

export async function saveBuilderComponent(formData: FormData) {
  const id = formData.get('id') as string;
  const type = (formData.get('type') as string) || 'FLOWER';
  const name = formData.get('name') as string;
  const unitPrice = parseIntegerInput(formData.get('unitPrice') as string | null);
  const minQuantity = parseIntegerInput(formData.get('minQuantity') as string | null) ?? 0;
  const maxQuantity = parseIntegerInput(formData.get('maxQuantity') as string | null);
  const isAvailable = formData.get('isAvailable') === 'on' || formData.get('isAvailable') === 'true';

  if (!name?.trim() || unitPrice === null) {
    return { error: 'Name and unit price are required' };
  }

  // Handle image: new upload takes priority, else keep existing
  let imageUrl: string | null = (formData.get('existingImageUrl') as string) || null;
  const newImageFile = formData.get('newImage');
  if (newImageFile instanceof File && newImageFile.size > 0) {
    imageUrl = await storeUploadedImage(newImageFile);
  }

  try {
    if (id) {
      await db.update(builderComponent).set({
        type, name, unitPrice, minQuantity, maxQuantity, isAvailable, imageUrl, updatedAt: new Date(),
      }).where(eq(builderComponent.id, id));
    } else {
      await db.insert(builderComponent).values({
        id: crypto.randomUUID(), type, name, unitPrice, minQuantity, maxQuantity, isAvailable, imageUrl, updatedAt: new Date(),
      });
    }

    revalidatePath('/admin/builder');
    revalidatePath('/custom-bouquet');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to save builder component' };
  }
}

export async function deleteBuilderComponent(id: string) {
  try {
    await db.delete(builderComponent).where(eq(builderComponent.id, id));
    revalidatePath('/admin/builder');
    revalidatePath('/custom-bouquet');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to delete builder component' };
  }
}

export async function toggleBuilderComponentAvailable(id: string, isAvailable: boolean) {
  try {
    await db.update(builderComponent).set({ isAvailable, updatedAt: new Date() }).where(eq(builderComponent.id, id));
    revalidatePath('/admin/builder');
    revalidatePath('/custom-bouquet');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to toggle availability' };
  }
}
