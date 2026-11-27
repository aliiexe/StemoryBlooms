import { db, product, builderComponent, deliveryZone, asc } from '@stemory/database';

// Called only after the admin page's own authorization check. Include unavailable IDs
// so an older draft keeps its selections and can explain what must be replaced.
export async function loadAssistedCatalog() {
  const [products, components, zones] = await Promise.all([
    db.select({ id: product.id, name: product.name, basePrice: product.basePrice, salePrice: product.salePrice,
      isSaleEnabled: product.isSaleEnabled, stock: product.stock, available: product.isAvailable, status: product.status, images: product.images }).from(product).orderBy(asc(product.name)),
    db.select({ id: builderComponent.id, name: builderComponent.name, price: builderComponent.unitPrice, type: builderComponent.type,
      stock: builderComponent.stock, available: builderComponent.isAvailable, imageUrl: builderComponent.imageUrl, minQuantity: builderComponent.minQuantity, maxQuantity: builderComponent.maxQuantity }).from(builderComponent).orderBy(asc(builderComponent.name)),
    db.select({ id: deliveryZone.id, name: deliveryZone.name, fee: deliveryZone.fee, available: deliveryZone.isActive }).from(deliveryZone).orderBy(asc(deliveryZone.name)),
  ]);
  return { products: products.map(({ images, isSaleEnabled, salePrice, basePrice, ...value }) => ({ ...value, price: isSaleEnabled && salePrice !== null ? salePrice : basePrice, image: images?.[0] || null })), components, zones };
}
export type AssistedCatalog = Awaited<ReturnType<typeof loadAssistedCatalog>>;
