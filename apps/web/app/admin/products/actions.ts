'use server';

import { db } from '@stemory/database';
import { product, productMaterial } from '@stemory/database/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function saveProduct(formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const basePrice = parseInt(formData.get('basePrice') as string, 10);
  
  const salePriceStr = formData.get('salePrice') as string;
  const salePrice = salePriceStr ? parseInt(salePriceStr, 10) : null;
  
  const imagesStr = formData.get('images') as string;
  let images: string[] = [];
  try {
    if (imagesStr) images = JSON.parse(imagesStr);
  } catch (e) {
    console.error("Failed to parse images json", e);
  }

  const status = formData.get('status') as string;
  const isAvailable = formData.get('isAvailable') === 'on';
  const isFeatured = formData.get('isFeatured') === 'on';

  const productMaterialsStr = formData.get('productMaterials') as string;
  let productMaterials: { materialId: string, quantity: number }[] = [];
  try {
    if (productMaterialsStr) productMaterials = JSON.parse(productMaterialsStr);
  } catch (e) {
    console.error("Failed to parse productMaterials", e);
  }

  if (!name || isNaN(basePrice)) {
    return { error: 'Name and valid base price are required' };
  }

  try {
    if (id) {
      // For updates, we clear existing materials and re-create them
      await db.delete(productMaterial).where(eq(productMaterial.productId, id));
      
      await db.update(product).set({ 
        updatedAt: new Date(),
        name, description, basePrice, salePrice, images, status, isAvailable, isFeatured
      }).where(eq(product.id, id));

      if (productMaterials.length > 0) {
        await db.insert(productMaterial).values(productMaterials.map(pm => ({
          id: crypto.randomUUID(),
          productId: id,
          materialId: pm.materialId,
          quantity: pm.quantity
        })));
      }
    } else {
      const [newProduct] = await db.insert(product).values({ 
        id: crypto.randomUUID(),
        updatedAt: new Date(),
        name, description, basePrice, salePrice, images, status, isAvailable, isFeatured
      }).returning({ id: product.id });

      if (productMaterials.length > 0) {
        await db.insert(productMaterial).values(productMaterials.map(pm => ({
          id: crypto.randomUUID(),
          productId: newProduct.id,
          materialId: pm.materialId,
          quantity: pm.quantity
        })));
      }
    }
    
    revalidatePath('/admin/products');
    revalidatePath('/shop');
  } catch (err) {
    console.error("Failed to save product:", err);
    return { error: 'Failed to save product. Make sure the database schema is updated.' };
  }

  redirect('/admin/products');
}

export async function deleteProduct(id: string) {
  try {
    await db.delete(product).where(eq(product.id, id));
    revalidatePath('/admin/products');
    revalidatePath('/shop');
    return { success: true };
  } catch (err) {
    return { error: 'Failed to delete product' };
  }
}

export async function quickUpdateProduct(id: string, updates: any) {
  try {
    await db.update(product).set({ ...updates, updatedAt: new Date() }).where(eq(product.id, id));
    revalidatePath('/admin/products');
    revalidatePath('/shop');
    return { success: true };
  } catch (err) {
    return { error: 'Failed to update product' };
  }
}

export async function backfillProductMaterialDeductions() {
  return { deducted: 0 };
}
