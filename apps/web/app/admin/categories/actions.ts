'use server';

import { db } from '@stemory/database';
import { eq } from 'drizzle-orm';
import { category } from '@stemory/database/schema';
import { revalidatePath } from 'next/cache';

export async function saveCategory(formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;

  if (!name) {
    return { error: 'Name is required' };
  }

  try {
    if (id) {
      await db.update(category).set({ name }).where(eq(category.id, id));
    } else {
      await db.insert(category).values({ id: crypto.randomUUID(), name });
    }
    
    revalidatePath('/admin/categories');
    return { success: true };
  } catch (err) {
    return { error: 'Failed to save category' };
  }
}

export async function deleteCategory(id: string) {
  try {
    await db.delete(category).where(eq(category.id, id));
    revalidatePath('/admin/categories');
    return { success: true };
  } catch (err) {
    return { error: 'Failed to delete category' };
  }
}
