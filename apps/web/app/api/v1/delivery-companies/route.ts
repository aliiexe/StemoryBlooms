import { NextResponse } from 'next/server';
import { asc } from 'drizzle-orm';
import { db, deliveryCompany } from '@stemory/database';

export async function GET() {
  const companies = await db.query.deliveryCompany.findMany({
    where: (table, { eq }) => eq(table.isActive, true),
    orderBy: [asc(deliveryCompany.name)],
  });

  return NextResponse.json({ companies });
}