'use server';

import { db, eq, product, productMaterial, material, builderComponent, productBuilderComponent, categoryToProduct } from '@stemory/database';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { z } from 'zod';
import { parseIntegerInput } from '../../../lib/form-values';
import { assertAdmin } from '../../../lib/user-sync';
import { recordAuditLog } from '@/lib/audit';

export async function saveProduct(formData: FormData) {
  await assertAdmin();
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const basePrice = Number(formData.get('basePrice') || NaN);

  const salePriceStr = formData.get('salePrice') as string;
  const salePrice = salePriceStr ? parseIntegerInput(salePriceStr) : null;

  // Images: the ImageUploader sends all images (existing URLs + new base64 data URLs)
  // as a JSON array in the 'images' hidden input field.
  const imagesStr = formData.get('images') as string;
  let allImages: string[] = [];
  try {
    if (imagesStr) allImages = JSON.parse(imagesStr);
  } catch (e) {
    console.error('Failed to parse images json', e);
  }

  const status = formData.get('status') as string;
  const isAvailable = formData.get('isAvailable') === 'on';
  const isFeatured = formData.get('isFeatured') === 'on';
  const isSaleEnabled = formData.get('isSaleEnabled') === 'true';
  const stock = Number(formData.get('stock') ?? 0);

  let finalSalePrice = salePrice;
  if (!isSaleEnabled) finalSalePrice = null;

  const productMaterialsStr = formData.get('productMaterials') as string;
  let productMaterialsList: { materialId: string, quantity: number }[] = [];
  try {
    if (productMaterialsStr) {
      const parsed = JSON.parse(productMaterialsStr);
      productMaterialsList = parsed.filter((b: any) => b.materialId && b.quantity > 0);
    }
  } catch (e) {
    console.error('Failed to parse product materials JSON', e);
  }

  const customFlowersBomStr = formData.get('productBuilderComponents') as string;
  let productBuilderComponentsList: { builderComponentId: string, quantity: number }[] = [];
  try {
    if (customFlowersBomStr) {
      const parsed = JSON.parse(customFlowersBomStr);
      productBuilderComponentsList = parsed.filter((b: any) => b.builderComponentId && b.quantity > 0);
    }
  } catch (e) {
    console.error('Failed to parse custom flowers BOM JSON', e);
  }

  const categoryIdsStr = formData.get('categoryIds') as string;
  let categoryIds: string[] = [];
  try {
    if (categoryIdsStr) {
      const parsed = JSON.parse(categoryIdsStr);
      categoryIds = [...new Set(parsed as string[])];
    }
  } catch (e) {
    console.error('Failed to parse category IDs JSON', e);
  }

  if (!name?.trim() || !description?.trim() || !Number.isSafeInteger(basePrice) || basePrice < 0 || basePrice > 1000000 || !Number.isSafeInteger(stock) || stock < 0 || stock > 100000 || !['PUBLISHED', 'DRAFT', 'HIDDEN', 'ARCHIVED'].includes(status)) {
    return { error: 'Name, description, and valid base price are required' };
  }

  if (!Array.isArray(allImages) || allImages.length === 0 || allImages.length > 10 || allImages.some(image => typeof image !== 'string' || image.length > 1500000)) {
    return { error: 'At least one product image is required' };
  }

  if (productMaterialsList.length === 0 && productBuilderComponentsList.length === 0) {
    return { error: 'At least one valid material or custom flower line is required' };
  }

  if (finalSalePrice !== null && (!Number.isSafeInteger(finalSalePrice) || finalSalePrice < 0 || finalSalePrice > basePrice)) return { error: 'Sale price must be between zero and the base price.' };
  if ([...productMaterialsList, ...productBuilderComponentsList].some(line => !Number.isSafeInteger(line.quantity) || line.quantity <= 0)) return { error: 'Recipe quantities must be positive whole units.' };

  try {
    let currentProductId = id;

    await db.transaction(async (tx) => {
      if (id) {
        const [existing] = await tx.select().from(product).where(eq(product.id, id)).for('update');
        if (!existing) throw new Error('Product not found.');
        if (Number(formData.get('expectedStock')) !== existing.stock) throw new Error('Stock changed while editing. Refresh before saving.');
        await tx.delete(productMaterial).where(eq(productMaterial.productId, id));
        await tx.delete(productBuilderComponent).where(eq(productBuilderComponent.productId, id));
        await tx.delete(categoryToProduct).where(eq(categoryToProduct.b, id));

        await tx.update(product).set({
          name, description, basePrice, salePrice: finalSalePrice, isSaleEnabled, images: allImages, status, isAvailable, isFeatured, stock, updatedAt: new Date()
        }).where(eq(product.id, id));
      } else {
        const [newProduct] = await tx.insert(product).values({
          id: crypto.randomUUID(),
          name, description, basePrice, salePrice: finalSalePrice, isSaleEnabled, images: allImages, status, isAvailable, isFeatured, stock, updatedAt: new Date()
        }).returning({ id: product.id });
        currentProductId = newProduct.id;

      }

      if (productMaterialsList.length > 0) {
        await tx.insert(productMaterial).values(productMaterialsList.map((pm) => ({
          id: crypto.randomUUID(),
          productId: currentProductId,
          materialId: pm.materialId,
          quantity: pm.quantity
        })));
      }

      if (productBuilderComponentsList.length > 0) {
        await tx.insert(productBuilderComponent).values(productBuilderComponentsList.map((pbc) => ({
          id: crypto.randomUUID(),
          productId: currentProductId,
          builderComponentId: pbc.builderComponentId,
          quantity: pbc.quantity
        })));
      }

      if (categoryIds.length > 0) {
        await tx.insert(categoryToProduct).values(categoryIds.map(catId => ({
          a: catId,
          b: currentProductId
        })));
      }
    });

    revalidatePath('/admin/products');
    revalidatePath('/shop');
    if (currentProductId) {
      revalidatePath(`/shop/${currentProductId}`);
    }

    await recordAuditLog({
      action: id ? 'UPDATE' : 'CREATE',
      target: 'PRODUCT',
      summary: `${id ? 'Updated' : 'Created'} product "${name}"`,
      details: { productId: currentProductId, name, basePrice, stock },
    });
  } catch (error) {
    console.error('Save product error:', error);
    return { error: error instanceof Error && error.message.startsWith('Stock changed') ? error.message : 'Failed to save product. Check the product and recipe details.' };
  }

  return { success: true };
}

export async function deleteProduct(id: string) {
  await assertAdmin();
  try {
    await db.transaction(async (tx) => {
      await tx.delete(productMaterial).where(eq(productMaterial.productId, id));
      await tx.delete(productBuilderComponent).where(eq(productBuilderComponent.productId, id));
      await tx.delete(categoryToProduct).where(eq(categoryToProduct.b, id));
      await tx.delete(product).where(eq(product.id, id));
    });
    revalidatePath('/admin/products');
    revalidatePath('/shop');

    await recordAuditLog({
      action: 'DELETE',
      target: 'PRODUCT',
      summary: `Deleted product`,
      details: { productId: id },
    });
    return { success: true };
  } catch {
    return { error: 'Failed to delete product' };
  }
}

export async function backfillProductMaterialDeductions() {
  await assertAdmin();
  return { error: 'Automatic backfill is disabled. Reconcile existing stock before applying any correction.' };
}

export async function quickUpdateProduct(id: string, updates: { stock?: number; expectedStock?: number; salePrice?: number | null; isSaleEnabled?: boolean }) {
  await assertAdmin();
  const parsed = z.object({
    stock: z.number().int().min(0).max(100000).optional(),
    expectedStock: z.number().int().optional(),
    salePrice: z.number().int().min(0).max(1000000).nullable().optional(),
    isSaleEnabled: z.boolean().optional(),
  }).strict().safeParse(updates);
  if (!id || !parsed.success) return { error: 'Please enter a valid price or whole stock quantity.' };
  try {
    const saved = await db.transaction(async tx => {
      const [current] = await tx.select().from(product).where(eq(product.id, id)).for('update');
      if (!current) throw new Error('Product not found.');
      if (updates.stock !== undefined && updates.expectedStock !== current.stock) throw new Error('Stock changed. Refresh this product and try again.');
      const { expectedStock: _expectedStock, ...values } = parsed.data;
      const payload = { ...values, ...(values.isSaleEnabled === false ? { salePrice: null } : {}),
        ...(values.stock !== undefined ? { isAvailable: values.stock > 0 } : {}), updatedAt: new Date() };
      const sale = values.isSaleEnabled ?? current.isSaleEnabled;
      const price = payload.salePrice === undefined ? current.salePrice : payload.salePrice;
      if (sale && (price === null || price > current.basePrice)) throw new Error('Sale price must be between zero and the base price.');
      const [result] = await tx.update(product).set(payload).where(eq(product.id, id)).returning();
      return result;
    });
    revalidatePath('/admin/products');
    revalidatePath('/shop');
    revalidatePath(`/shop/${id}`);
    await recordAuditLog({ action: 'UPDATE', target: 'PRODUCT', summary: 'Updated product price or finished stock', details: { productId: id, updates } });
    return { success: true, product: saved };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to update product.' };
  }
}
