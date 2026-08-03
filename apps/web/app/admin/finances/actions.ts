'use server';

import { prisma } from '@stemory/database';
import { revalidatePath } from 'next/cache';

export async function saveExpense(formData: FormData) {
  const id = formData.get('id') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as string;
  const amount = parseInt(formData.get('amount') as string, 10);
  const dateStr = formData.get('date') as string;

  if (!description || isNaN(amount) || !category) {
    return { error: 'Description, category, and valid amount are required' };
  }

  const date = dateStr ? new Date(dateStr) : new Date();

  try {
    if (id) {
      await prisma.expense.update({
        where: { id },
        data: { description, category, amount, date }
      });
    } else {
      await prisma.expense.create({
        data: { description, category, amount, date }
      });
    }
    
    revalidatePath('/admin/finances');
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: 'Failed to save expense' };
  }
}

export async function deleteExpense(id: string) {
  try {
    await prisma.expense.delete({ where: { id } });
    revalidatePath('/admin/finances');
    return { success: true };
  } catch (err) {
    return { error: 'Failed to delete expense' };
  }
}
