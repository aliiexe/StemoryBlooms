'use server';

import { prisma } from '@stemory/database';
import { revalidatePath } from 'next/cache';

export async function saveMaterial(formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const quantity = parseInt(formData.get('quantity') as string, 10);
  const cost = parseInt(formData.get('cost') as string, 10);
  const lowStockThreshold = parseInt(formData.get('lowStockThreshold') as string, 10);

  if (!name || isNaN(quantity)) {
    return { error: 'Name and valid quantity are required' };
  }

  try {
    if (id) {
      await prisma.material.update({
        where: { id },
        data: { name, quantity, cost: isNaN(cost) ? null : cost, lowStockThreshold: isNaN(lowStockThreshold) ? null : lowStockThreshold }
      });
    } else {
      await prisma.material.create({
        data: { name, quantity, cost: isNaN(cost) ? null : cost, lowStockThreshold: isNaN(lowStockThreshold) ? null : lowStockThreshold }
      });
    }
    
    revalidatePath('/admin/materials');
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: 'Failed to save material' };
  }
}

export async function deleteMaterial(id: string) {
  try {
    await prisma.material.delete({ where: { id } });
    revalidatePath('/admin/materials');
    return { success: true };
  } catch (err) {
    return { error: 'Failed to delete material' };
  }
}
