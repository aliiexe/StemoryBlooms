'use server';

import { revalidatePath } from 'next/cache';
import { db, eq, builderComponent, material } from '@stemory/database';
import crypto from 'crypto';
import { parseIntegerInput } from '../../../lib/form-values';
import { assertAdmin } from '../../../lib/user-sync';


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

  if (!name?.trim() || unitPrice === null) {
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
      let oldStock = 0;
      let oldMaterials: { materialId: string; quantity: number }[] = [];

      if (id) {
        const existing = await tx.query.builderComponent.findFirst({ where: eq(builderComponent.id, id) });
        if (existing) {
          oldStock = existing.stock;
          oldMaterials = (existing.materials as { materialId: string; quantity: number }[]) || [];
        }
      }

      // Calculate material usage differences
      const oldUsage = new Map<string, number>();
      for (const om of oldMaterials) {
        oldUsage.set(om.materialId, oldStock * om.quantity);
      }

      const newUsage = new Map<string, number>();
      for (const nm of materials) {
        newUsage.set(nm.materialId, stock * nm.quantity);
      }

      const allMatIds = new Set([...oldUsage.keys(), ...newUsage.keys()]);

      for (const mId of allMatIds) {
        const oldU = oldUsage.get(mId) ?? 0;
        const newU = newUsage.get(mId) ?? 0;
        const diff = newU - oldU;

        if (diff !== 0) {
          const mat = await tx.query.material.findFirst({ where: eq(material.id, mId) });
          if (mat) {
            await tx.update(material)
              .set({ quantity: mat.quantity - diff, updatedAt: new Date() })
              .where(eq(material.id, mId));
          }
        }
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
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to save builder component' };
  }
}


export async function deleteBuilderComponent(id: string) {
  await assertAdmin();
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
  await assertAdmin();
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

export async function updateBuilderComponentStock(id: string, newStock: number) {
  await assertAdmin();
  try {
    await db.transaction(async (tx) => {
      const existing = await tx.query.builderComponent.findFirst({ where: eq(builderComponent.id, id) });
      if (!existing) return;

      const oldStock = existing.stock;
      if (oldStock === newStock) return;

      const materials = (existing.materials as { materialId: string; quantity: number }[]) || [];
      
      const oldUsage = new Map<string, number>();
      for (const om of materials) {
        oldUsage.set(om.materialId, oldStock * om.quantity);
      }

      const newUsage = new Map<string, number>();
      for (const nm of materials) {
        newUsage.set(nm.materialId, newStock * nm.quantity);
      }

      const allMatIds = new Set([...oldUsage.keys(), ...newUsage.keys()]);

      for (const mId of allMatIds) {
        const oldU = oldUsage.get(mId) ?? 0;
        const newU = newUsage.get(mId) ?? 0;
        const diff = newU - oldU;

        if (diff !== 0) {
          const mat = await tx.query.material.findFirst({ where: eq(material.id, mId) });
          if (mat) {
            await tx.update(material)
              .set({ quantity: mat.quantity - diff, updatedAt: new Date() })
              .where(eq(material.id, mId));
          }
        }
      }

      await tx.update(builderComponent).set({ stock: newStock, updatedAt: new Date() }).where(eq(builderComponent.id, id));
    });

    revalidatePath('/admin/builder');
    revalidatePath('/custom-bouquet');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to update stock' };
  }
}
