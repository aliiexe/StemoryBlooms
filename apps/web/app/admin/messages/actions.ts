'use server';

import { prisma } from '@stemory/database';
import { revalidatePath } from 'next/cache';

export async function markMessageRead(id: string) {
  await prisma.contactMessage.update({ where: { id }, data: { status: 'READ' } });
  revalidatePath('/admin/messages');
}

export async function markMessageResolved(id: string) {
  await prisma.contactMessage.update({ where: { id }, data: { status: 'RESOLVED' } });
  revalidatePath('/admin/messages');
}
