'use server';

import { prisma } from '@stemory/database';
import { revalidatePath } from 'next/cache';

export async function submitReview(productId: string, formData: FormData) {
  const authorName = formData.get('authorName') as string;
  const rating = parseInt(formData.get('rating') as string, 10);
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  if (!authorName || !rating || !content) {
    return { error: 'Please fill out all required fields.' };
  }

  try {
    await prisma.review.create({
      data: {
        productId,
        authorName,
        rating,
        title,
        content,
        status: 'PENDING'
      }
    });

    revalidatePath(`/shop/${productId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to submit review:', error);
    return { error: 'Something went wrong. Please try again.' };
  }
}
