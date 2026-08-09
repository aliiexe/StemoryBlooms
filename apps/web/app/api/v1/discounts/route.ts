import { NextResponse } from 'next/server';
import { db, eq, promoCode, giftCard } from '@stemory/database';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const code = (body?.code || '').toString().trim().toUpperCase();
    const type = (body?.type || 'promo').toString();
    const subtotal = Number(body?.subtotal || 0);

    if (!code || !Number.isFinite(subtotal)) {
      return NextResponse.json({ message: 'Code and subtotal are required' }, { status: 400 });
    }

    if (type === 'giftCard') {
      const dbGiftCard = await db.query.giftCard.findFirst({
        where: eq(giftCard.code, code)
      });

      if (!dbGiftCard || !dbGiftCard.isActive || dbGiftCard.currentBalance <= 0) {
        return NextResponse.json({ message: 'Gift card is invalid or has no balance' }, { status: 400 });
      }

      const discountAmount = Math.min(dbGiftCard.currentBalance, Math.max(0, subtotal));
      return NextResponse.json({
        valid: true,
        type: 'giftCard',
        code,
        discountAmount,
        message: `Gift card applied for ${discountAmount} MAD`
      });
    }

    const dbPromo = await db.query.promoCode.findFirst({
      where: eq(promoCode.code, code)
    });

    if (!dbPromo || !dbPromo.isActive || (dbPromo.usageLimit && dbPromo.usageCount >= dbPromo.usageLimit)) {
      return NextResponse.json({ message: 'Promo code is invalid or expired' }, { status: 400 });
    }

    let discountAmount = 0;
    if (dbPromo.type === 'PERCENTAGE') {
      discountAmount = Math.round(Math.max(0, subtotal) * (dbPromo.value / 100));
    } else if (dbPromo.type === 'FIXED') {
      discountAmount = Math.min(dbPromo.value, Math.max(0, subtotal));
    }

    return NextResponse.json({
      valid: true,
      type: 'promo',
      code,
      discountAmount,
      message: `Promo code applied for ${discountAmount} MAD`
    });
  } catch (error: any) {
    console.error('Failed to validate discount code', error);
    return NextResponse.json({ message: 'Failed to validate code' }, { status: 500 });
  }
}
