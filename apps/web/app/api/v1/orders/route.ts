import { NextResponse } from 'next/server';
import { db, eq, sql, promoCode as promoCodeTable, giftCard as giftCardTable, customer, order, orderItem, deliveryZone, adminNotification, product, builderComponent } from '@stemory/database';
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

    let verifiedSubtotal = 0;
    const finalOrderItems: any[] = [];
    
    const productIds = cartItems.map(i => i.productId).filter(Boolean) as string[];
    const dbProducts = productIds.length > 0 ? await db.query.product.findMany({ where: (t, { inArray }) => inArray(t.id, productIds) }) : [];
    const productsMap = new Map(dbProducts.map(p => [p.id, p]));

    for (const item of cartItems) {
      if (item.productId) {
        const p = productsMap.get(item.productId);
        if (!p) return NextResponse.json({ message: `Product not found: ${item.name}` }, { status: 400 });
        const realPrice = p.salePrice ?? p.basePrice;
        verifiedSubtotal += realPrice * item.quantity;
        finalOrderItems.push({
           ...item,
           unitPrice: realPrice,
           totalPrice: realPrice * item.quantity,
           configuration: item.configuration
        });
      } else {
        let customPrice = 0;
        if (item.configuration && typeof item.configuration === 'object') {
          const compIds = Object.keys(item.configuration);
          if (compIds.length > 0) {
             const comps = await db.query.builderComponent.findMany({ where: (t, { inArray }) => inArray(t.id, compIds) });
             const compsMap = new Map(comps.map(c => [c.id, c]));
             for (const [cId, qty] of Object.entries(item.configuration)) {
               const c = compsMap.get(cId);
               if (c) customPrice += c.unitPrice * (qty as number);
             }
          }
        }
        verifiedSubtotal += customPrice * item.quantity;
        finalOrderItems.push({
           ...item,
           unitPrice: customPrice,
           totalPrice: customPrice * item.quantity,
           configuration: item.configuration
        });
      }
    }

    const activeDeliveryZone = deliveryCompanyId
      ? await db.query.deliveryZone.findFirst({ where: eq(deliveryZone.id, deliveryCompanyId) })
      : await db.query.deliveryZone.findFirst({ where: (table, { eq }) => eq(table.isActive, true) });
    const deliveryFee = activeDeliveryZone?.fee ?? 50;

    const createdOrderResult = await db.transaction(async (tx) => {
      let discountAmount = 0;
      let appliedPromoId: string | null = null;
      let promoDetails: { type: 'PERCENTAGE' | 'FIXED'; value: number } | null = null;

      if (promoCode) {
        const dbPromo = await tx.query.promoCode.findFirst({
          where: eq(promoCodeTable.code, promoCode.toUpperCase().trim())
        });
        if (!dbPromo || !dbPromo.isActive || (dbPromo.usageLimit && dbPromo.usageCount >= dbPromo.usageLimit)) {
          throw new Error('Invalid or expired promo code');
        }
        appliedPromoId = dbPromo.id;
        promoDetails = { type: dbPromo.type as 'PERCENTAGE' | 'FIXED', value: dbPromo.value };
      }

      const orderTotals = calculateOrderTotals({ subtotal: verifiedSubtotal, promoCode, promoDetails, deliveryFee });
      discountAmount += orderTotals.discountAmount;

      let appliedGiftCardId: string | null = null;
      let usedGiftCardAmount = 0;
      if (giftCardCode) {
        const dbGiftCard = await tx.query.giftCard.findFirst({
          where: eq(giftCardTable.code, giftCardCode.toUpperCase().trim())
        });
        if (!dbGiftCard || !dbGiftCard.isActive || dbGiftCard.currentBalance <= 0) {
          throw new Error('Invalid or expired gift card');
        }
        appliedGiftCardId = dbGiftCard.id;
        usedGiftCardAmount = Math.min(dbGiftCard.currentBalance, verifiedSubtotal - discountAmount);
        discountAmount += usedGiftCardAmount;
      }

      const total = Math.max(0, verifiedSubtotal - discountAmount) + deliveryFee;

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

      const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

      const [createdOrder] = await tx.insert(order).values({
        id: crypto.randomUUID(),
        orderNumber,
        idempotencyKey,
        customerId: dbCustomer.id,
        subtotal: verifiedSubtotal,
        deliveryFee,
        discount: discountAmount,
        total,
        status: 'NEW',
        notes: deliveryInstructions,
        deliveryAddress: { city, addressLine1: address },
        updatedAt: new Date()
      }).returning();

      if (finalOrderItems.length > 0) {
        await tx.insert(orderItem).values(finalOrderItems.map(i => ({
          id: crypto.randomUUID(),
          orderId: createdOrder.id,
          productId: i.productId,
          productName: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
          configuration: i.configuration,
          updatedAt: new Date()
        })));

        for (const item of finalOrderItems) {
          if (item.productId) {
            await tx.execute(
              sql`UPDATE "Product" SET "stock" = "stock" - ${item.quantity}, "isAvailable" = CASE WHEN ("stock" - ${item.quantity}) > 0 THEN true ELSE false END WHERE "id" = ${item.productId} AND "stock" >= ${item.quantity}`
            );
          } else if (item.configuration) {
            for (const [cId, qty] of Object.entries(item.configuration)) {
               const totalDeduct = (qty as number) * item.quantity;
               await tx.execute(
                 sql`UPDATE "BuilderComponent" SET "stock" = "stock" - ${totalDeduct}, "isAvailable" = CASE WHEN ("stock" - ${totalDeduct}) > 0 THEN true ELSE false END WHERE "id" = ${cId} AND "stock" >= ${totalDeduct}`
               );
            }
          }
        }
      }

      if (appliedPromoId) {
        await tx.execute(sql`UPDATE "PromoCode" SET "usageCount" = "usageCount" + 1, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${appliedPromoId} AND ("usageLimit" IS NULL OR "usageCount" < "usageLimit")`);
      }

      if (appliedGiftCardId && usedGiftCardAmount > 0) {
        await tx.execute(sql`UPDATE "GiftCard" SET "currentBalance" = "currentBalance" - ${usedGiftCardAmount}, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${appliedGiftCardId} AND "currentBalance" >= ${usedGiftCardAmount}`);
      }

      return { createdOrder, verifiedSubtotal, discountAmount, total };
    });

    const { createdOrder, verifiedSubtotal: finalSub, discountAmount: finalDisc, total: finalTotal } = createdOrderResult;

    try {
      const html = await render(
        OrderConfirmationTemplate({
          customerName,
          customerEmail: email,
          orderNumber: createdOrder.orderNumber,
          subtotal: finalSub,
          deliveryFee,
          discount: finalDisc,
          total: finalTotal,
          city,
          address,
          items: finalOrderItems.map(i => ({ name: i.name, quantity: i.quantity, price: i.unitPrice })),
        })
      );
      await resend.emails.send({
        from: 'Stemory Blooms <onboarding@resend.dev>',
        to: ['stemoryblooms@gmail.com'],
        subject: `🌸 New Order #${createdOrder.orderNumber} — ${customerName}`,
        html,
      });
    } catch (e) {
      console.error('Email send failed', e);
    }

    await db.insert(adminNotification).values({
      id: crypto.randomUUID(),
      type: 'ORDER_NEW',
      title: 'New Order Received',
      message: `Order ${createdOrder.orderNumber} placed for ${finalTotal} MAD by ${customerName}.`,
      isRead: false,
      createdAt: new Date()
    });

    return NextResponse.json(createdOrder, { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ message: 'Failed to create order', error: error.message || 'Unknown error' }, { status: 500 });
  }
}
