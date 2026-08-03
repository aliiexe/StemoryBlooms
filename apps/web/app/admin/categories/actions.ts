'use server';

import { prisma } from '@stemory/database';
import { revalidatePath } from 'next/cache';

export async function saveCategory(formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;

  if (!name) {
    return { error: 'Name is required' };
  }

  try {
    if (id) {
      await prisma.category.update({
        where: { id },
        data: { name }
      });
    } else {
      await prisma.category.create({
        data: { name }
      });
    }
    
    revalidatePath('/admin/categories');
    return { success: true };
  } catch (err) {
    return { error: 'Failed to save category' };
  }
}

export async function deleteCategory(id: string) {
  try {
    await prisma.category.delete({ where: { id } });
    revalidatePath('/admin/categories');
    return { success: true };
  } catch (err) {
    return { error: 'Failed to delete category' };
  }
}
