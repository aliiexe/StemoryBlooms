import React from 'react';
import { db } from '@stemory/database';
import styles from '../dashboard.module.css';
import WaitlistClient from './WaitlistClient';

export default async function AdminWaitlistPage() {
  const waitlistEntry = await db.query.waitlistEntry.findMany({
    orderBy: (table, { desc }) => [desc(table.createdAt)]
  });

  return <WaitlistClient waitlist={waitlistEntry} />;
}
