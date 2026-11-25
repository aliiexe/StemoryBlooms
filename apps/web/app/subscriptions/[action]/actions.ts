'use server';
import { headers } from 'next/headers';
import { enforceSubmissionLimit } from '@/lib/commerce/rate-limit';
import { consumeCommunicationToken } from '@/lib/commerce/waitlist';
export async function confirmSubscriptionChange(input: { token: string; action: string }) {
  if (input.action !== 'verify' && input.action !== 'unsubscribe') return {error:'Invalid action.'};
  try {
    await enforceSubmissionLimit('subscription-token',await headers(),10);
    await consumeCommunicationToken(input.token,input.action === 'verify' ? 'VERIFY' : 'UNSUBSCRIBE');
    return {success:true as const};
  } catch(error) {return {error:error instanceof Error?error.message:'This request could not be completed.'};}
}
