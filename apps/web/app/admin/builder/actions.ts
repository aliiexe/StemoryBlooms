'use server';

import { revalidatePath } from 'next/cache';
import { db, eq, builderComponent } from '@stemory/database';
import crypto from 'crypto';
import { parseIntegerInput } from '../../../lib/form-values';
import { uploadImage } from '../../../lib/upload';


export async function saveBuilderComponent(formData: FormData) {
  const id = formData.get('id') as string;
  const type = (formData.get('type') as string) || 'FLOWER';
  const name = formData.get('name') as string;
  const unitPrice = parseIntegerInput(formData.get('unitPrice') as string | null);
  const minQuantity = parseIntegerInput(formData.get('minQuantity') as string | null) ?? 0;
  const maxQuantity = parseIntegerInput(formData.get('maxQuantity') as string | null);
  const isAvailable = formData.get('isAvailable') === 'on' || formData.get('isAvailable') === 'true';

  // Parse materials BOM
  const materialsStr = formData.get('componentMaterials') as string;
  let materials: { materialId: string; quantity: number }[] = [];
  try {
    if (materialsStr) materials = JSON.parse(materialsStr);
  } catch { /* ignore */ }

  if (!name?.trim() || unitPrice === null) {
    return { error: 'Name and unit price are required' };
  }

  // Handle image: new upload takes priority, else keep existing
  let imageUrl: string | null = (formData.get('existingImageUrl') as string) || null;
  const newImageFile = formData.get('newImage');
  if (newImageFile instanceof File && newImageFile.size > 0) {
    imageUrl = await uploadImage(newImageFile);
  }

  try {
    if (id) {
      await db.update(builderComponent).set({
        type, name, unitPrice, minQuantity, maxQuantity, isAvailable, imageUrl,
        materials: materials.length > 0 ? materials : null,
        updatedAt: new Date(),
      }).where(eq(builderComponent.id, id));
    } else {
      await db.insert(builderComponent).values({
        id: crypto.randomUUID(), type, name, unitPrice, minQuantity, maxQuantity, isAvailable, imageUrl,
        materials: materials.length > 0 ? materials : null,
        updatedAt: new Date(),
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
