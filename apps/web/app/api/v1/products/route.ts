import { NextResponse } from 'next/server';
import { db, product } from '@stemory/database';



export async function GET() {
  try {
    const products = await db.select().from(product);
    return NextResponse.json(products);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
