'use server';

import { prisma } from '@stemory/database';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function saveProduct(formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const basePrice = parseInt(formData.get('basePrice') as string, 10);
  const status = formData.get('status') as string;
  const isAvailable = formData.get('isAvailable') === 'on';

  if (!name || isNaN(basePrice)) {
    return { error: 'Name and valid base price are required' };
  }

  try {
    if (id) {
      await prisma.product.update({
        where: { id },
        data: { name, description, basePrice, status, isAvailable }
      });
    } else {
      await prisma.product.create({
        data: { name, description, basePrice, status, isAvailable }
      });
    }
    
    revalidatePath('/admin/products');
    revalidatePath('/shop');
  } catch (err) {
    return { error: 'Failed to save product' };
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
