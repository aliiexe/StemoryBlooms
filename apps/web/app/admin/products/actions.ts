'use server';

import { db, eq, product, productMaterial } from '@stemory/database';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import crypto from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { parseIntegerInput } from '../../../lib/form-values';

async function storeUploadedImages(uploadedFiles: File[]) {
  const uploadDir = path.resolve(process.cwd(), 'apps/web/public/uploads');
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

export async function saveProduct(formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const basePrice = parseIntegerInput(formData.get('basePrice') as string | null);

  const salePriceStr = formData.get('salePrice') as string;
  const salePrice = salePriceStr ? parseIntegerInput(salePriceStr) : null;

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

  const status = formData.get('status') as string;
  const isAvailable = formData.get('isAvailable') === 'on';
  const isFeatured = formData.get('isFeatured') === 'on';

  const productMaterialsStr = formData.get('productMaterials') as string;
  let productMaterialsList: { materialId: string, quantity: number }[] = [];
  try {
    if (productMaterialsStr) productMaterialsList = JSON.parse(productMaterialsStr);
  } catch (e) {
    console.error('Failed to parse productMaterials', e);
  }

  if (!name?.trim() || !description?.trim() || basePrice === null) {
    return { error: 'Name, description, and valid base price are required' };
  }

  if (allImages.length === 0) {
    return { error: 'At least one product image is required' };
  }

  if (productMaterialsList.length === 0 || productMaterialsList.some((entry) => !entry.materialId || entry.quantity <= 0)) {
    return { error: 'At least one valid material line is required' };
  }

  try {
    let currentProductId = id;

    await db.transaction(async (tx) => {
      if (id) {
        await tx.delete(productMaterial).where(eq(productMaterial.productId, id));

        await tx.update(product).set({
          name, description, basePrice, salePrice, images: allImages, status, isAvailable, isFeatured, updatedAt: new Date()
        }).where(eq(product.id, id));
      } else {
        const [newProduct] = await tx.insert(product).values({
          id: crypto.randomUUID(),
          name, description, basePrice, salePrice, images: allImages, status, isAvailable, isFeatured, updatedAt: new Date()
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
    });

    revalidatePath('/admin/products');
    revalidatePath('/shop');
    if (currentProductId) {
      revalidatePath(`/shop/${currentProductId}`);
    }
  } catch (error) {
    console.error('Failed to save product:', error);
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
  } catch {
    return { error: 'Failed to delete product' };
  }
}
