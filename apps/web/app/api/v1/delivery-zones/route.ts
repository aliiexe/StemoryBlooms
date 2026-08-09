import { NextResponse } from 'next/server';
import { asc } from 'drizzle-orm';
import { db, deliveryZone } from '@stemory/database';

export async function GET() {
  try {
    const zones = await db.query.deliveryZone.findMany({
      where: (table, { eq }) => eq(table.isActive, true),
      orderBy: [asc(deliveryZone.name)],
    });

    return NextResponse.json({ zones });
  } catch (error) {
    console.error('Failed to fetch delivery zones:', error);
    return NextResponse.json({ zones: [] }, { status: 500 });
  }
}
