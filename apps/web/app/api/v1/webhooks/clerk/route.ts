import { NextResponse } from 'next/server';
import { prisma } from '@stemory/database';
import { Webhook } from 'svix';
import { headers } from 'next/headers';



export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'Webhook secret missing' }, { status: 500 });

  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  // Get raw body for Webhook verification
  const payload = await req.text();

  const wh = new Webhook(secret);
  let evt: any;
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Webhook verification failed', err);
    return NextResponse.json({ error: 'Webhook verification failed' }, { status: 400 });
  }

  const eventType = evt.type;
  if (eventType === 'user.created' || eventType === 'user.updated') {
    const data = evt.data;
    const email = data.email_addresses?.[0]?.email_address;

    if (email) {
      const role = await prisma.role.upsert({
        where: { name: 'CUSTOMER' },
        update: {},
        create: { name: 'CUSTOMER' }
      });

      await prisma.user.upsert({
        where: { clerkId: data.id },
        update: {
          email,
          firstName: data.first_name || '',
          lastName: data.last_name || '',
        },
        create: {
          clerkId: data.id,
          email,
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          roleId: role.id
        }
      });
    }
  }

  return NextResponse.json({ success: true });
}
