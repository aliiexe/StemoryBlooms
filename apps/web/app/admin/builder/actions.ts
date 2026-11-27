'use server';
import {validateImageReferences} from '@/lib/image-references';

import { revalidatePath } from 'next/cache';
import { db, eq, builderComponent, material, sql } from '@stemory/database';
import crypto from 'crypto';
import { z } from 'zod';
import { inArray } from 'drizzle-orm';
import { parseIntegerInput } from '../../../lib/form-values';
import { assertAdmin } from '../../../lib/user-sync';
import { recordAuditLog } from '@/lib/audit';
import { rememberQuickComponent } from '@/lib/commerce/quick-components';
import { publicError } from '@/lib/commerce/errors';

export async function addQuickBuilderComponent(input: unknown) {
  const actor = await assertAdmin();
  try {
    const component = await rememberQuickComponent(input, actor.id);
    revalidatePath('/admin/builder');
    revalidatePath('/admin/orders/new');
    return { success: true as const, component: {
      id: component.id, name: component.name, price: component.unitPrice, type: component.type,
      stock: component.stock, available: component.isAvailable, imageUrl: component.imageUrl,
      minQuantity: component.minQuantity, maxQuantity: component.maxQuantity,
    } };
  } catch (error) { return { success: false as const, error: publicError(error).message }; }
}


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
    materials = z.array(z.object({materialId:z.string().min(1).max(128),quantity:z.number().int().min(1).max(10000)}).strict()).max(100).parse(JSON.parse(materialsStr || '[]'));
    if (new Set(materials.map(row=>row.materialId)).size !== materials.length) return {error:'List each raw ingredient once.'};
  } catch { return {error:'Every recipe ingredient needs a positive whole quantity.'}; }

  if (!name?.trim() || unitPrice === null || unitPrice < 0 || !Number.isSafeInteger(stock) || (!id && stock < 0) || minQuantity < 0 || (maxQuantity !== null && maxQuantity < Math.max(1, minQuantity)) || !['FLOWER', 'LEAF', 'ANIMAL_BUG', 'WRAPPING', 'CARD'].includes(type)) {
    return { error: 'Name and unit price are required' };
  }

  // Image: the ImageUploader sends all images as a JSON array via the hidden 'images' input
  // For single-image builder components we take the first one.
  let imageUrl: string | null = null;
  let imageList:unknown=[];
  const imagesStr = formData.get('images') as string;
  try {
    if (imagesStr) {
      imageList=JSON.parse(imagesStr);
    }
  } catch { return {error:'Choose a valid uploaded image.'}; }

  try {
    await db.transaction(async (tx) => {
      for (const materialId of materials.map(row=>row.materialId).sort()) await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${`recipe-material:${materialId}`},0))`);
      if (materials.length) {
        const ingredients=await tx.select({id:material.id}).from(material).where(inArray(material.id,materials.map(row=>row.materialId)));
        if(ingredients.length!==materials.length)throw new Error('A recipe ingredient no longer exists.');
      }
      if (id) {
        const [existing] = await tx.select().from(builderComponent).where(eq(builderComponent.id, id)).for('update');
        if (!existing) throw new Error('Component not found.');
        imageUrl=validateImageReferences(imageList,existing.imageUrl?[existing.imageUrl]:[],1)[0]||null;
        // Metadata editing never overwrites counts changed by orders or corrections.
      }
      if(!id)imageUrl=validateImageReferences(imageList,[],1)[0]||null;
      if (!id && stock !== 0) throw new Error('New components start at zero. Record production or a count correction after saving.');
      if (id) {
        await tx.update(builderComponent).set({
          type, name: name.trim(), unitPrice, minQuantity, maxQuantity, isAvailable, imageUrl,
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
    await db.update(builderComponent).set({ isAvailable: false, updatedAt: new Date() }).where(eq(builderComponent.id, id));
    revalidatePath('/admin/builder');
    revalidatePath('/custom-bouquet');

    await recordAuditLog({
      action: 'DISABLE',
      target: 'BUILDER_COMPONENT',
      summary: `Disabled builder component`,
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
  if(typeof isAvailable!=='boolean')return {error:'Choose a valid availability state.'};
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

export async function updateBuilderComponentStock(_id: string, _newStock: number, _expectedStock: number) {
  await assertAdmin();
  void _id; void _newStock; void _expectedStock;
  return { error: 'Use Production or a reasoned stock correction to change stock.' };
}
