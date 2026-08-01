import { NextResponse } from 'next/server';
import { PrismaClient } from '@stemory/database';
import { CheckoutPayloadSchema } from '@stemory/contracts';

const prisma = new PrismaClient();

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

    const { cartItems, customerName, phoneNumber, city, address, deliveryInstructions } = parsed.data;

    let subtotal = 0;
    for (const item of cartItems) {
      subtotal += item.price * item.quantity;
    }
    const deliveryFee = 50; // Fixed delivery fee for now
    const total = subtotal + deliveryFee;

    const order = await prisma.$transaction(async (tx) => {
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

    return NextResponse.json(order);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ message: 'Failed to create order', error: error.message }, { status: 500 });
  }
}
