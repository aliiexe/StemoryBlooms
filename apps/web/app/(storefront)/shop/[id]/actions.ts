'use server';

import { db, review, product, eq, and } from '@stemory/database';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { headers } from 'next/headers';
import { reviewInput } from '@/lib/commerce/public-input';
import { enforceSubmissionLimit } from '@/lib/commerce/rate-limit';
import { publicError } from '@/lib/commerce/errors';

export async function submitReview(productId: string, formData: FormData) {
  const parsed = reviewInput.safeParse({ ...Object.fromEntries(formData), productId });
  if (!parsed.success) return { error: 'Enter your name, a rating from 1 to 5, and a review up to 3,000 characters.' };
  const { authorName, rating, title, content } = parsed.data;
  try {
    await enforceSubmissionLimit('reviews', await headers(), 3);
    const published = await db.query.product.findFirst({ where: and(eq(product.id, productId), eq(product.status, 'PUBLISHED')), columns: { id: true } });
    if (!published) return { error: 'This product is unavailable for reviews.' };
    await db.insert(review).values({
      id: crypto.randomUUID(),
      productId,
      authorName,
      rating,
      title,
      content,
      status: 'PENDING',
      updatedAt: new Date()
    });

    revalidatePath(`/shop/${productId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to submit review:', error);
    return { error: publicError(error).message };
  }
}
