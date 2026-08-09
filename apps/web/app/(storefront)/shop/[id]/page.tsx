import { notFound } from 'next/navigation';
import { db } from '@stemory/database';
import PDPClient from './PDPClient';

export default async function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fetch the current product
  const product = await db.query.product.findFirst({
    where: (products, { eq }) => eq(products.id, id),
    with: { 
      categoryToProducts: { with: { category: true } },
      reviews: {
        where: (reviews, { eq }) => eq(reviews.status, 'APPROVED'),
        orderBy: (reviews, { desc }) => [desc(reviews.createdAt)]
      }
    }
  });

  if (!product || product.status !== 'PUBLISHED') {
    notFound();
  }

  // Fetch recommendations (products in the same categories, excluding the current one)
  const categoryIds = product.categoryToProducts.map((c: any) => c.category.id);
  
  let recommendations: any[] = [];
  
  if (categoryIds.length > 0) {
    const allRecs = await db.query.product.findMany({
      where: (products, { eq, and, ne }) => and(
        eq(products.status, 'PUBLISHED'),
        ne(products.id, id)
      ),
      with: { categoryToProducts: { with: { category: true } } },
      orderBy: (products, { desc }) => [desc(products.createdAt)]
    });
    recommendations = allRecs.filter((r: any) => r.categoryToProducts.some((c: any) => categoryIds.includes(c.category.id))).slice(0, 4);
  }

  // Fallback: If no related products found, just fetch latest 4 products
  if (recommendations.length === 0) {
    recommendations = await db.query.product.findMany({
      where: (products, { eq, and, ne }) => and(
        eq(products.status, 'PUBLISHED'),
        ne(products.id, id),
      ),
      limit: 4,
      orderBy: (products, { desc }) => [desc(products.createdAt)]
    });
  }

  return (
    <PDPClient 
      product={product} 
      recommendations={recommendations} 
    />
  );
}
