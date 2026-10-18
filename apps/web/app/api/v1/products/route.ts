import { NextResponse } from 'next/server';
import { db, product, eq } from '@stemory/database';



export async function GET() {
  try {
    const products = await db.select({ id: product.id, name: product.name, description: product.description,
      basePrice: product.basePrice, salePrice: product.salePrice, isSaleEnabled: product.isSaleEnabled,
      images: product.images, stock: product.stock, isAvailable: product.isAvailable,
      processingEstimate: product.processingEstimate }).from(product).where(eq(product.status, 'PUBLISHED'));
    return NextResponse.json(products);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
