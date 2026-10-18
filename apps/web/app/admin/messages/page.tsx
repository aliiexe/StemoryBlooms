import { assertAdmin } from '@/lib/user-sync';
import React from 'react';
import { db, contactMessage } from '@stemory/database';
import { desc } from 'drizzle-orm';
import MessagesClient from './MessagesClient';

export default async function AdminMessagesPage() {
  await assertAdmin();
  const messages = await db.query.contactMessage.findMany({
    orderBy: [desc(contactMessage.createdAt)]
  });

  return <MessagesClient messages={messages} />;
}
