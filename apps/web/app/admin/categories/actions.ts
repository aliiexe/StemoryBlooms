'use server';

import { db } from '@stemory/database';
import { eq } from 'drizzle-orm';
import { category } from '@stemory/database/schema';
import { revalidatePath } from 'next/cache';
import { assertAdmin } from '../../../lib/user-sync';
import { recordAuditLog } from '@/lib/audit';
import crypto from 'crypto';

export async function saveCategory(formData: FormData) {
  await assertAdmin();
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
    await recordAuditLog({
      action: id ? 'UPDATE' : 'CREATE',
      target: 'CATEGORY',
      summary: `${id ? 'Updated' : 'Created'} category "${name}"`,
      details: { categoryId: id, name },
    });
    return { success: true };
  } catch (err) {
    return { error: 'Failed to save category' };
  }
}

export async function deleteCategory(id: string) {
  await assertAdmin();
  try {
    await db.delete(category).where(eq(category.id, id));
    revalidatePath('/admin/categories');
    await recordAuditLog({
      action: 'DELETE',
      target: 'CATEGORY',
      summary: `Deleted category`,
      details: { categoryId: id },
    });
    return { success: true };
  } catch (err) {
    return { error: 'Failed to delete category' };
  }
}
