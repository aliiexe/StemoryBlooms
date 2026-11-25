'use server';

import { after } from 'next/server';
import { requestWaitlistVerification } from '@/lib/commerce/waitlist';
import { processNotificationOutbox } from '@/lib/commerce/outbox';
import { headers } from 'next/headers';
import { publicEmail } from '@/lib/commerce/public-input';
import { enforceSubmissionLimit } from '@/lib/commerce/rate-limit';
import { publicError } from '@/lib/commerce/errors';

export async function joinWaitlist(email: string) {
  const parsed = publicEmail.safeParse(email);
  if (!parsed.success) return { error: 'Invalid email address' };
  try {
    await enforceSubmissionLimit('waitlist', await headers(), 5);
    const result = await requestWaitlistVerification(parsed.data);
    if (result.jobId) after(async () => { await processNotificationOutbox(1, undefined, result.jobId!); });
    return { success: true };
  } catch (error) {
    console.error('Waitlist submission failed:', error);
    return { error: publicError(error).message };
  }
}
