import {db,user,eq} from '@stemory/database';
import { NextResponse } from 'next/server';
import {z} from 'zod';
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { syncClerkUserToDatabase } from '@/lib/user-sync';

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'Webhook secret missing' }, { status: 500 });

  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  const payload = await req.text();

  const wh = new Webhook(secret);
  let evt: unknown;
  try {
    evt = wh.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });
  } catch (err) {
    console.error('Webhook verification failed', err);
    return NextResponse.json({ error: 'Webhook verification failed' }, { status: 400 });
  }

  const parsed=z.object({type:z.string(),data:z.object({id:z.string().min(1)}).passthrough()}).safeParse(evt);
  if(!parsed.success)return NextResponse.json({error:'Invalid webhook payload'},{status:400});
  const eventType = parsed.data.type;
  if (eventType === 'user.created' || eventType === 'user.updated') {
    const data = parsed.data.data;
    if (data?.id) {
      await syncClerkUserToDatabase(data.id);
    }
  }

  if(eventType==='user.deleted') await db.update(user).set({roleId:null,updatedAt:new Date()}).where(eq(user.clerkId,parsed.data.data.id));

  return NextResponse.json({ success: true });
}
