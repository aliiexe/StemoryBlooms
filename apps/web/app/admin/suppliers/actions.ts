'use server';

import { revalidatePath } from 'next/cache';
import { db, eq, supplier } from '@stemory/database';
import crypto from 'crypto';
import { assertAdmin } from '@/lib/user-sync';

export async function saveSupplier(formData: FormData) {
  await assertAdmin();
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const contactName = formData.get('contactName') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const address = formData.get('address') as string;

  if (!name?.trim()) {
    return { error: 'Supplier name is required' };
  }

  try {
    if (id) {
      await db.update(supplier).set({
        name,
        contactName: contactName || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        updatedAt: new Date(),
      }).where(eq(supplier.id, id));
    } else {
      await db.insert(supplier).values({
        id: crypto.randomUUID(),
        name,
        contactName: contactName || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        updatedAt: new Date(),
      });
    }

    revalidatePath('/admin/suppliers');
    revalidatePath('/admin/materials');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to save supplier' };
  }
}

export async function deleteSupplier(id: string) {
  await assertAdmin();
  try {
    await db.delete(supplier).where(eq(supplier.id, id));
    revalidatePath('/admin/suppliers');
    revalidatePath('/admin/materials');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to delete supplier' };
  }
}
