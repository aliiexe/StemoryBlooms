import { publicSiteCopy } from '@/lib/site-content';
import { db, product as productTable, orderItem, order, eq, desc, sql } from '@stemory/database';
import HomeClient from './HomeClient';

export default async function HomePage() {
  const settings = await db.query.siteSettings.findFirst();
  const config = settings?.config as Record<string, unknown> | null;
  const heroImages = (config?.heroImages as string[]) || [];
  const heroFadeSpeed = (config?.heroFadeSpeed as number) || 5;

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
    stock: p.stock, isAvailable: p.isAvailable,
    salePrice: p.isSaleEnabled ? p.salePrice : null,
    imageUrl: p.images?.[0] || '/hero-bouquet.png'
  }));

  const topSellingProductIds = await db
    .select({
      productId: orderItem.productId,
      sales: sql<number>`sum(${orderItem.quantity})`
    })
    .from(orderItem)
    .innerJoin(order,eq(order.id,orderItem.orderId))
    .innerJoin(productTable,eq(productTable.id,orderItem.productId))
    .where(sql`${order.status} <> 'CANCELLED' AND ${productTable.status}='PUBLISHED'`)
    .groupBy(orderItem.productId)
    .orderBy(desc(sql<number>`sum(${orderItem.quantity})`))
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
    stock: p.stock, isAvailable: p.isAvailable,
    salePrice: p.isSaleEnabled ? p.salePrice : null,
    imageUrl: p.images?.[0] || '/hero-bouquet.png'
  }));

  const heroCopy = await publicSiteCopy('home');
  return (
    <HomeClient
      trackInventory={config?.inventoryTrackingEnabled !== false}
      heroCopy={heroCopy}
      collectionProducts={collectionProducts}
      bestSellerProducts={bestSellerProducts}
      heroImages={heroImages}
      heroFadeSpeed={heroFadeSpeed}
    />
  );
}
