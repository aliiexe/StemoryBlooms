'use server';

import { revalidatePath } from 'next/cache';
import { db, eq, builderComponent, material } from '@stemory/database';
import crypto from 'crypto';
import { parseIntegerInput } from '../../../lib/form-values';
import { assertAdmin } from '../../../lib/user-sync';
import { recordAuditLog } from '@/lib/audit';


export async function saveBuilderComponent(formData: FormData) {
  await assertAdmin();
  const id = formData.get('id') as string;
  const type = (formData.get('type') as string) || 'FLOWER';
  const name = formData.get('name') as string;
  const unitPrice = parseIntegerInput(formData.get('unitPrice') as string | null);
  const minQuantity = parseIntegerInput(formData.get('minQuantity') as string | null) ?? 0;
  const maxQuantity = parseIntegerInput(formData.get('maxQuantity') as string | null);
  const stock = parseIntegerInput(formData.get('stock') as string | null) ?? 0;
  const isAvailable = formData.get('isAvailable') === 'on' || formData.get('isAvailable') === 'true';

  // Parse materials BOM
  const materialsStr = formData.get('componentMaterials') as string;
  let materials: { materialId: string; quantity: number }[] = [];
  try {
    if (materialsStr) materials = JSON.parse(materialsStr);
  } catch { /* ignore */ }

  if (!name?.trim() || unitPrice === null || unitPrice < 0 || !Number.isSafeInteger(stock) || stock < 0 || minQuantity < 0 || (maxQuantity !== null && maxQuantity < Math.max(1, minQuantity)) || !['FLOWER', 'LEAF', 'ANIMAL_BUG', 'WRAPPING', 'CARD'].includes(type)) {
    return { error: 'Name and unit price are required' };
  }

  // Image: the ImageUploader sends all images as a JSON array via the hidden 'images' input
  // For single-image builder components we take the first one.
  let imageUrl: string | null = null;
  const imagesStr = formData.get('images') as string;
  try {
    if (imagesStr) {
      const parsed = JSON.parse(imagesStr) as string[];
      imageUrl = parsed[0] ?? null;
    }
  } catch { /* ignore */ }

  try {
    await db.transaction(async (tx) => {
      if (id) {
        const [existing] = await tx.select().from(builderComponent).where(eq(builderComponent.id, id)).for('update');
        if (!existing) throw new Error('Component not found.');
        if (Number(formData.get('expectedStock')) !== existing.stock) throw new Error('Stock changed while editing. Refresh before saving.');
      }
      if (id) {
        await tx.update(builderComponent).set({
          type, name, unitPrice, stock, minQuantity, maxQuantity, isAvailable, imageUrl,
          materials: materials.length > 0 ? materials : null,
          updatedAt: new Date(),
        }).where(eq(builderComponent.id, id));
      } else {
        await tx.insert(builderComponent).values({
          id: crypto.randomUUID(), type, name, unitPrice, stock, minQuantity, maxQuantity, isAvailable, imageUrl,
          materials: materials.length > 0 ? materials : null,
          updatedAt: new Date(),
        });
      }
    });

    revalidatePath('/admin/builder');
    revalidatePath('/custom-bouquet');

    await recordAuditLog({
      action: id ? 'UPDATE' : 'CREATE',
      target: 'BUILDER_COMPONENT',
      summary: `${id ? 'Updated' : 'Created'} builder component "${name}"`,
      details: { componentId: id, name, type },
    });
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: error instanceof Error && error.message.startsWith('Stock changed') ? error.message : 'Failed to save builder component' };
  }
}


export async function deleteBuilderComponent(id: string) {
  await assertAdmin();
  try {
    await db.delete(builderComponent).where(eq(builderComponent.id, id));
    revalidatePath('/admin/builder');
    revalidatePath('/custom-bouquet');

    await recordAuditLog({
      action: 'DELETE',
      target: 'BUILDER_COMPONENT',
      summary: `Deleted builder component`,
      details: { componentId: id },
    });
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to delete builder component' };
  }
}

export async function toggleBuilderComponentAvailable(id: string, isAvailable: boolean) {
  await assertAdmin();
  try {
    await db.update(builderComponent).set({ isAvailable, updatedAt: new Date() }).where(eq(builderComponent.id, id));
    revalidatePath('/admin/builder');
    revalidatePath('/custom-bouquet');

    await recordAuditLog({
      action: 'UPDATE',
      target: 'BUILDER_COMPONENT',
      summary: `Toggled availability`,
      details: { componentId: id, isAvailable },
    });
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to toggle availability' };
  }
}

export async function updateBuilderComponentStock(id: string, newStock: number, expectedStock: number) {
  await assertAdmin();
  if (!Number.isSafeInteger(newStock) || newStock < 0 || newStock > 100000) return { error: 'Enter a nonnegative whole stock count.' };
  try {
    await db.transaction(async (tx) => {
      const [existing] = await tx.select().from(builderComponent).where(eq(builderComponent.id, id)).for('update');
      if (!existing) throw new Error('Component not found.');
      if (existing.stock !== expectedStock) throw new Error('Stock changed. Refresh and try again.');
      await tx.update(builderComponent).set({ stock: newStock, isAvailable: newStock > 0, updatedAt: new Date() }).where(eq(builderComponent.id, id));
    });

    revalidatePath('/admin/builder');
    revalidatePath('/custom-bouquet');

    await recordAuditLog({
      action: 'UPDATE',
      target: 'BUILDER_COMPONENT',
      summary: `Updated stock`,
      details: { componentId: id, newStock },
    });
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to update stock' };
  }
}
