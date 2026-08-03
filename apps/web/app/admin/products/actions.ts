'use server';

import { prisma } from '@stemory/database';
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

  if (!name || isNaN(basePrice)) {
    return { error: 'Name and valid base price are required' };
  }

  try {
    if (id) {
      await prisma.product.update({
        where: { id },
        data: { name, description, basePrice, salePrice, images, status, isAvailable, isFeatured }
      });
    } else {
      await prisma.product.create({
        data: { name, description, basePrice, salePrice, images, status, isAvailable, isFeatured }
      });
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
    await prisma.product.delete({ where: { id } });
    revalidatePath('/admin/products');
    revalidatePath('/shop');
    return { success: true };
  } catch (err) {
    return { error: 'Failed to delete product' };
  }
}
