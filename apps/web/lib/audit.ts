import { auth, currentUser } from '@clerk/nextjs/server';
import { headers } from 'next/headers';
import { db } from '@stemory/database';
import { auditLog } from '@stemory/database/schema';

export async function recordAuditLog(args: {
  action: string;
  target: string;
  summary: string;
  details?: any;
}) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    const headersList = await headers();
    
    // Attempt to parse out best IP address
    const forwardedFor = headersList.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';
    
    await db.insert(auditLog).values({
      id: crypto.randomUUID(),
      actorId: null, // skip internal user lookup to save time
      action: args.action,
      target: args.target,
      summary: args.summary,
      details: {
        ...args.details,
        clerkId: userId,
        email: user?.primaryEmailAddress?.emailAddress || 'unknown',
      },
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
