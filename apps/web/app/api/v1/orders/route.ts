import { NextResponse } from 'next/server';
import { prisma } from '@stemory/database';
import { CheckoutPayloadSchema } from '@stemory/contracts';
import { Resend } from 'resend';
import { OrderConfirmationTemplate } from '../../../../components/emails/OrderConfirmation';

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

    const { cartItems, customerName, phoneNumber, city, address, deliveryInstructions, promoCode } = parsed.data;

    let subtotal = 0;
    for (const item of cartItems) {
      subtotal += item.price * item.quantity;
    }
    const deliveryFee = 50; // Fixed delivery fee for now
    let discountAmount = 0;
    let appliedPromoId: string | null = null;

    if (promoCode) {
      const dbPromo = await prisma.promoCode.findUnique({ where: { code: promoCode.toUpperCase().trim() } });
      if (dbPromo && dbPromo.isActive && (!dbPromo.usageLimit || dbPromo.usageCount < dbPromo.usageLimit)) {
        appliedPromoId = dbPromo.id;
        if (dbPromo.type === 'PERCENTAGE') {
          discountAmount = Math.round(subtotal * (dbPromo.value / 100));
        } else if (dbPromo.type === 'FIXED') {
          discountAmount = dbPromo.value;
        }
      } else {
        return NextResponse.json({ message: 'Invalid or expired promo code' }, { status: 400 });
      }
    }

    const total = Math.max(0, subtotal - discountAmount) + deliveryFee;

    const order = await prisma.$transaction(async (tx: any) => {
      // Find or create customer
      // Since email isn't in CheckoutPayloadSchema currently, we match by phone
      const dbCustomer = await tx.customer.upsert({
        where: { phone: phoneNumber },
        update: { firstName: customerName, lastName: '' },
        create: {
          firstName: customerName,
          lastName: '',
          phone: phoneNumber,
        }
      });

      // Generate a random order number
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

      return tx.order.create({
        data: {
          orderNumber,
          idempotencyKey,
          customerId: dbCustomer.id,
          subtotal,
          deliveryFee,
          discount: discountAmount,
          total,
          status: 'NEW',
          notes: deliveryInstructions,
          deliveryAddress: {
            city,
            addressLine1: address,
          },
          items: {
            create: cartItems.map(i => ({
              productName: i.name,
              quantity: i.quantity,
              unitPrice: i.price,
              totalPrice: i.price * i.quantity,
            }))
          },
        }
      });
    });

    if (appliedPromoId) {
      await prisma.promoCode.update({
        where: { id: appliedPromoId },
        data: { usageCount: { increment: 1 } }
      });
    }

    // Attempt to send email
    if (process.env.RESEND_API_KEY) {
      try {
        // Assuming we have customer email in the future, for now fallback to test email if none
        const customerEmail = "test@stemoryblooms.com"; 
        await resend.emails.send({
          from: 'Stemory Blooms <orders@stemoryblooms.com>',
          to: [customerEmail],
          subject: `Order Confirmation #${order.orderNumber}`,
          react: OrderConfirmationTemplate({ 
            customerName: customerName, 
            orderNumber: order.orderNumber, 
            total: total 
          }) as React.ReactElement,
        });
      } catch (emailErr) {
        console.error('Failed to send order confirmation email:', emailErr);
      }
    } else {
      console.log(`[Email Mock] Order Confirmation #${order.orderNumber} sent to customer.`);
    }

    return NextResponse.json(order);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ message: 'Failed to create order', error: error.message }, { status: 500 });
  }
}
