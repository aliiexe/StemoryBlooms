import { after, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createCheckout } from '@/lib/commerce/orders';
import { publicError } from '@/lib/commerce/errors';
import { processNotificationOutbox } from '@/lib/commerce/outbox';
import { enforceSubmissionLimit } from '@/lib/commerce/rate-limit';

export async function POST(request: Request) {
  try {
    const key = request.headers.get('idempotency-key') || '';
    if (!/^[A-Za-z0-9_-]{16,128}$/.test(key)) return NextResponse.json({ message: 'A valid Idempotency-Key header is required.' }, { status: 400 });
    const raw = await request.text();
    if (raw.length > 65536) return NextResponse.json({ message: 'Order request is too large.' }, { status: 413 });
    let payload: unknown;
    try { payload = JSON.parse(raw); } catch { return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 }); }
    await enforceSubmissionLimit('orders', request.headers, 10);
    const { userId } = await auth();
    const result = await createCheckout(payload, key, userId);
    after(() => processNotificationOutbox(2, result.id).catch(error => console.error('Notification processing failed', error)));
    return NextResponse.json(result, { status: result.replayed ? 200 : 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const result = publicError(error);
    if (result.status === 500) console.error('Order creation failed', error);
    return NextResponse.json({ message: result.message, code: result.code }, { status: result.status, ...(result.status === 429 ? { headers: { 'Retry-After': '60' } } : {}) });
  }
}
