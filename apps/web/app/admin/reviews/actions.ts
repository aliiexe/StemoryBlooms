'use server';

import { prisma } from '@stemory/database';
import { revalidatePath } from 'next/cache';

export async function approveReview(id: string) {
  try {
    const review = await prisma.review.update({
      where: { id },
      data: { status: 'APPROVED' }
    });
    revalidatePath(`/shop/${review.productId}`);
    revalidatePath('/reviews');
    revalidatePath('/admin/reviews');
    return { success: true };
  } catch (error) {
    return { error: 'Failed to approve review' };
  }
}

export async function rejectReview(id: string) {
  try {
    const review = await prisma.review.update({
      where: { id },
      data: { status: 'REJECTED' }
    });
    revalidatePath(`/shop/${review.productId}`);
    revalidatePath('/reviews');
    revalidatePath('/admin/reviews');
    return { success: true };
  } catch (error) {
    return { error: 'Failed to reject review' };
  }
}

export async function deleteReview(id: string) {
  try {
    const review = await prisma.review.delete({
      where: { id }
    });
    revalidatePath(`/shop/${review.productId}`);
    revalidatePath('/reviews');
    revalidatePath('/admin/reviews');
    return { success: true };
  } catch (error) {
    return { error: 'Failed to delete review' };
  }
}
