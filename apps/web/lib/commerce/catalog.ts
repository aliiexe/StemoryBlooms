import { z } from 'zod';
import { db, product, category, categoryToProduct, review, eq, and, sql, asc, desc } from '@stemory/database';
import type { CommerceDatabase } from './orders';
import { CommerceError } from './errors';
const one=(value:unknown)=>Array.isArray(value)?value[0]:value;
const optionalPrice=z.preprocess(value=>value===''||value===undefined?undefined:Number(value),z.number().int().min(0).max(1000000).optional());
export function catalogFilters(input:Record<string,unknown>) {
  const result=z.object({search:z.string().trim().max(150).default(''),category:z.string().max(128).default(''),availability:z.enum(['ALL','AVAILABLE']).default('ALL'),sort:z.enum(['NEWEST','PRICE_ASC','PRICE_DESC','NAME','BEST_SELLERS']).default('NEWEST'),min:optionalPrice,max:optionalPrice,page:z.coerce.number().int().min(1).max(10000).default(1)}).safeParse(Object.fromEntries(['search','category','availability','sort','min','max','page'].map(key=>[key,one(input[key])])));
  if(!result.success)throw new CommerceError('Check the search, price range, and filters.');
  if(result.data.min!==undefined&&result.data.max!==undefined&&result.data.min>result.data.max)throw new CommerceError('The minimum price cannot exceed the maximum.');
  return result.data;
}
export type CatalogFilters=ReturnType<typeof catalogFilters>;
const price=sql<number>`CASE WHEN ${product.isSaleEnabled} AND ${product.salePrice} IS NOT NULL THEN ${product.salePrice} ELSE ${product.basePrice} END`;
export const publicCardColumns={id:product.id,name:product.name,basePrice:product.basePrice,salePrice:product.salePrice,isSaleEnabled:product.isSaleEnabled,stock:product.stock,isAvailable:product.isAvailable,imageUrl:sql<string|null>`${product.images}[1]`,processingEstimate:product.processingEstimate};
export type CatalogCard={id:string;name:string;basePrice:number;salePrice:number|null;isSaleEnabled:boolean;stock:number;isAvailable:boolean;imageUrl:string|null;processingEstimate:string|null};
export async function browseCatalog(filters:CatalogFilters,database:CommerceDatabase=db) {
  const settings=await database.query.siteSettings.findFirst();
  const trackInventory=(settings?.config as {inventoryTrackingEnabled?:boolean}|null)?.inventoryTrackingEnabled!==false;
  const pattern=`%${filters.search.replace(/[\\%_]/g,value=>`\\${value}`)}%`;
  const where=and(eq(product.status,'PUBLISHED'),filters.search?sql`(${product.name} ILIKE ${pattern} OR ${product.description} ILIKE ${pattern})`:undefined,filters.category?sql`EXISTS(SELECT 1 FROM ${categoryToProduct} link WHERE link."B"=${product.id} AND link."A"=${filters.category})`:undefined,filters.availability==='AVAILABLE'?and(eq(product.isAvailable,true),trackInventory?sql`${product.stock}>0`:undefined):undefined,filters.min!==undefined?sql`${price}>=${filters.min}`:undefined,filters.max!==undefined?sql`${price}<=${filters.max}`:undefined);
  const popularity=sql<number>`(SELECT COALESCE(sum(oi.quantity),0) FROM "OrderItem" oi JOIN "Order" orders ON orders.id=oi."orderId" WHERE oi."productId"=${product.id} AND orders.status<>'CANCELLED')`;
  const orderBy=filters.sort==='BEST_SELLERS'?desc(popularity):filters.sort==='PRICE_ASC'?asc(price):filters.sort==='PRICE_DESC'?desc(price):filters.sort==='NAME'?asc(product.name):desc(product.createdAt);
  const [items,total,categories]=await Promise.all([
    database.select(publicCardColumns).from(product).where(where).orderBy(orderBy,asc(product.id)).limit(12).offset((filters.page-1)*12),
    database.select({count:sql<number>`count(*)::integer`}).from(product).where(where),
    database.select({id:category.id,name:category.name}).from(category).where(sql`EXISTS(SELECT 1 FROM ${categoryToProduct} link JOIN ${product} p ON p.id=link."B" WHERE link."A"=${category.id} AND p.status='PUBLISHED')`).orderBy(asc(category.name)),
  ]);
  return {items,count:total[0].count,categories,trackInventory};
}
export async function relatedCatalogItems(id:string,categoryIds:string[],database:CommerceDatabase=db) {
  const settings=await database.query.siteSettings.findFirst();
  const trackInventory=(settings?.config as {inventoryTrackingEnabled?:boolean}|null)?.inventoryTrackingEnabled!==false;
  const where=and(eq(product.status,'PUBLISHED'),sql`${product.id}<>${id}`,trackInventory?sql`${product.stock}>0`:undefined,eq(product.isAvailable,true));
  const related=categoryIds.length?await database.select(publicCardColumns).from(product).where(and(where,sql`EXISTS(SELECT 1 FROM ${categoryToProduct} link WHERE link."B"=${product.id} AND link."A" IN (${sql.join(categoryIds.map(value=>sql`${value}`),sql`, `)}))`)).orderBy(desc(product.createdAt),asc(product.id)).limit(4):[];
  if(related.length===4)return related;
  const ids=[id,...related.map(row=>row.id)];const extra=await database.select(publicCardColumns).from(product).where(and(where,sql`${product.id} NOT IN (${sql.join(ids.map(value=>sql`${value}`),sql`, `)})`)).orderBy(desc(product.createdAt),asc(product.id)).limit(4-related.length);
  return [...related,...extra];
}
export async function publicReviews(productId:string,page:number,database:CommerceDatabase=db){
  const where=and(eq(review.productId,productId),eq(review.status,'APPROVED'),sql`${review.rating} BETWEEN 1 AND 5`);
  const [items,total]=await Promise.all([database.select({id:review.id,authorName:review.authorName,rating:review.rating,title:review.title,content:review.content,createdAt:review.createdAt}).from(review).where(where).orderBy(desc(review.createdAt),asc(review.id)).limit(10).offset((page-1)*10),database.select({count:sql<number>`count(*)::integer`,rating:sql<number|null>`avg(${review.rating})::float`}).from(review).where(where)]);
  return {items,...total[0]};
}
