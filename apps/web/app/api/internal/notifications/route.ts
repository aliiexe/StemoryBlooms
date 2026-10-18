import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { processNotificationOutbox } from '@/lib/commerce/outbox';

export async function POST(request: Request) {
  const secret = process.env.INTERNAL_JOB_SECRET;
  const supplied = request.headers.get('authorization') || '';
  const expected = `Bearer ${secret}`;
  if (!secret || Buffer.byteLength(supplied) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(await processNotificationOutbox(), { headers: { 'Cache-Control': 'no-store' } });
}
