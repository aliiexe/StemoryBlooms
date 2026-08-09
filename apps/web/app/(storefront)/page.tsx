import { db, product as productTable, orderItem, eq, desc, sql } from '@stemory/database';
import HomeClient from './HomeClient';

export default async function HomePage() {
  const dbProducts = await db.query.product.findMany({
    where: eq(productTable.status, 'PUBLISHED'),
    limit: 8,
    orderBy: [desc(productTable.createdAt)]
  });

  type DbProduct = (typeof dbProducts)[number];
  const collectionProducts = dbProducts.slice(0, 4).map((p: DbProduct) => ({
    id: p.id,
    title: p.name,
    price: p.basePrice,
    salePrice: p.isSaleEnabled ? p.salePrice : null,
    imageUrl: p.images?.[0] || '/hero-bouquet.png'
  }));

  const topSellingProductIds = await db
    .select({
      productId: orderItem.productId,
      sales: sql<number>`count(${orderItem.productId})`
    })
    .from(orderItem)
    .groupBy(orderItem.productId)
    .orderBy(desc(sql<number>`count(${orderItem.productId})`))
    .limit(3);

  const bestSellerIds = topSellingProductIds
    .map((t) => t.productId)
    .filter((id): id is string => Boolean(id));

  let bestSellerDbProducts: DbProduct[] = [];
  if (bestSellerIds.length > 0) {
    bestSellerDbProducts = await db.query.product.findMany({
      where: (products, { inArray, and, eq }) => and(
        inArray(products.id, bestSellerIds),
        eq(products.status, 'PUBLISHED')
      )
    });
    bestSellerDbProducts.sort((a, b) => bestSellerIds.indexOf(a.id) - bestSellerIds.indexOf(b.id));
  }

  const bestSellerProducts = bestSellerDbProducts.map((p: DbProduct) => ({
    id: p.id,
    title: p.name,
    price: p.basePrice,
    salePrice: p.isSaleEnabled ? p.salePrice : null,
    imageUrl: p.images?.[0] || '/hero-bouquet.png'
  }));

  return <HomeClient collectionProducts={collectionProducts} bestSellerProducts={bestSellerProducts} />;
}
