import { NextResponse } from 'next/server';
import { db, eq, sql, promoCode as promoCodeTable, giftCard as giftCardTable, customer, order, orderItem, deliveryZone, adminNotification } from '@stemory/database';
import { CheckoutPayloadSchema } from '@stemory/contracts';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { OrderConfirmationTemplate } from '../../../../components/emails/OrderConfirmation';
import { calculateOrderTotals } from './orderUtils';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');

export async function POST(request: Request) {
  const idempotencyKey = request.headers.get('idempotency-key');
  if (!idempotencyKey) {
    return NextResponse.json({ message: 'Idempotency-Key header is required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const parsed = CheckoutPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Validation failed', errors: parsed.error.errors }, { status: 400 });
    }

    const { cartItems, customerName, email, phoneNumber, city, address, deliveryInstructions, promoCode, giftCardCode, deliveryCompanyId } = parsed.data;

    let subtotal = 0;
    for (const item of cartItems) {
      subtotal += item.price * item.quantity;
    }
    const activeDeliveryZone = deliveryCompanyId
      ? await db.query.deliveryZone.findFirst({ where: eq(deliveryZone.id, deliveryCompanyId) })
      : await db.query.deliveryZone.findFirst({ where: (table, { eq }) => eq(table.isActive, true) });
    const deliveryFee = activeDeliveryZone?.fee ?? 50;
    let discountAmount = 0;
    let appliedPromoId: string | null = null;
    let appliedGiftCardId: string | null = null;
    let promoDetails: { type: 'PERCENTAGE' | 'FIXED'; value: number } | null = null;

    if (promoCode) {
      const dbPromo = await db.query.promoCode.findFirst({
        where: eq(promoCodeTable.code, promoCode.toUpperCase().trim())
      });
      if (dbPromo && dbPromo.isActive && (!dbPromo.usageLimit || dbPromo.usageCount < dbPromo.usageLimit)) {
        appliedPromoId = dbPromo.id;
        promoDetails = { type: dbPromo.type as 'PERCENTAGE' | 'FIXED', value: dbPromo.value };
      } else {
        return NextResponse.json({ message: 'Invalid or expired promo code' }, { status: 400 });
      }
    }

    if (giftCardCode) {
      const dbGiftCard = await db.query.giftCard.findFirst({
        where: eq(giftCardTable.code, giftCardCode.toUpperCase().trim())
      });
      if (dbGiftCard && dbGiftCard.isActive && dbGiftCard.currentBalance > 0) {
        appliedGiftCardId = dbGiftCard.id;
        const giftDiscount = Math.min(dbGiftCard.currentBalance, subtotal);
        discountAmount += giftDiscount;
      } else {
        return NextResponse.json({ message: 'Invalid or expired gift card' }, { status: 400 });
      }
    }

    const orderTotals = calculateOrderTotals({ subtotal, promoCode, promoDetails, deliveryFee });
    discountAmount += orderTotals.discountAmount;
    const total = Math.max(0, subtotal - discountAmount) + deliveryFee;

    const createdOrderResult = await db.transaction(async (tx) => {
      // Upsert customer
      const [dbCustomer] = await tx.insert(customer).values({
        id: crypto.randomUUID(),
        firstName: customerName,
        lastName: '',
        email: email,
        phone: phoneNumber,
        updatedAt: new Date()
      }).onConflictDoUpdate({
        target: customer.email,
        set: { firstName: customerName, phone: phoneNumber, updatedAt: new Date() }
      }).returning();

      // Generate a random order number
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

      const [createdOrder] = await tx.insert(order).values({
        id: crypto.randomUUID(),
        orderNumber,
        idempotencyKey,
        customerId: dbCustomer.id,
        subtotal,
        deliveryFee,
        discount: discountAmount,
        total,
        status: 'NEW',
        notes: deliveryInstructions,
        deliveryAddress: { city, addressLine1: address },
        updatedAt: new Date()
      }).returning();

      if (cartItems.length > 0) {
        await tx.insert(orderItem).values(cartItems.map(i => ({
          id: crypto.randomUUID(),
          orderId: createdOrder.id,
          productId: i.productId, // Make sure productId is stored in the DB if available! Wait, cartItems maps id to productId in the payload. Let's assume cartItem has productId.
          productName: i.name,
          quantity: i.quantity,
          unitPrice: i.price,
          totalPrice: i.price * i.quantity,
          updatedAt: new Date()
        })));

        // Decrement stock for each product
        for (const item of cartItems) {
          if (item.productId) {
            await tx.execute(
              sql`UPDATE "Product" SET "stock" = "stock" - ${item.quantity}, "isAvailable" = CASE WHEN ("stock" - ${item.quantity}) > 0 THEN true ELSE false END WHERE "id" = ${item.productId}`
            );
          }
        }
      }

      return createdOrder;
    });

    if (appliedPromoId) {
      await db.update(promoCodeTable)
        .set({ usageCount: sql`${promoCodeTable.usageCount} + 1`, updatedAt: new Date() })
        .where(eq(promoCodeTable.id, appliedPromoId));
    }

    if (appliedGiftCardId) {
      const dbGiftCard = await db.query.giftCard.findFirst({ where: eq(giftCardTable.id, appliedGiftCardId) });
      if (dbGiftCard) {
        const used = Math.min(dbGiftCard.currentBalance, subtotal);
        await db.update(giftCardTable)
          .set({ currentBalance: dbGiftCard.currentBalance - used, updatedAt: new Date() })
          .where(eq(giftCardTable.id, appliedGiftCardId));
      }
    }

    // Attempt to send email
    try {
      const html = await render(
        OrderConfirmationTemplate({
          customerName,
          customerEmail: email,
          orderNumber: createdOrderResult.orderNumber,
          subtotal,
          deliveryFee,
          discount: discountAmount,
          total,
          city,
          address,
          items: cartItems.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
        })
      );
      const { data, error: resendError } = await resend.emails.send({
        from: 'Stemory Blooms <onboarding@resend.dev>',
        to: ['stemoryblooms@gmail.com'],
        subject: `🌸 New Order #${createdOrderResult.orderNumber} — ${customerName}`,
        html,
        headers: {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'high'
        }
      });
      if (resendError) {
        console.error('Resend error:', JSON.stringify(resendError));
      } else {
        console.log('Email sent, id:', data?.id);
      }
    } catch (emailErr) {
      console.error('Email send threw:', emailErr);
    }

    // Create an admin notification for the new order
    await db.insert(adminNotification).values({
      id: crypto.randomUUID(),
      type: 'ORDER_NEW',
      title: 'New Order Received',
      message: `Order ${createdOrderResult.orderNumber} placed for ${total} MAD by ${customerName}.`,
      isRead: false,
      createdAt: new Date()
    });

    return NextResponse.json(createdOrderResult, { status: 201 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ message: 'Failed to create order', error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
