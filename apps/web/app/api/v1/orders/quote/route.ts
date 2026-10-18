import { NextResponse } from 'next/server';
import { quoteCheckout } from '@/lib/commerce/orders';
import { publicError } from '@/lib/commerce/errors';
import { enforceSubmissionLimit } from '@/lib/commerce/rate-limit';

export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (raw.length > 65536) return NextResponse.json({ message: 'Cart is too large.' }, { status: 413 });
    let payload: unknown;
    try { payload = JSON.parse(raw); } catch { return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 }); }
    await enforceSubmissionLimit('quotes', request.headers, 60);
    return NextResponse.json(await quoteCheckout(payload), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const result = publicError(error);
    return NextResponse.json({ message: result.message, code: result.code }, { status: result.status });
  }
}
