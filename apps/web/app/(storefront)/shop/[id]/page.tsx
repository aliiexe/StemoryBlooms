import { notFound } from 'next/navigation';
import { prisma } from '@stemory/database';
import PDPClient from './PDPClient';

export default async function ProductDetailsPage({ params }: { params: { id: string } }) {
  const { id } = params;

  // Fetch the current product
  const product = await prisma.product.findUnique({
    where: { id },
    include: { 
      categories: true,
      reviews: {
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!product || product.status !== 'PUBLISHED') {
    notFound();
  }

  // Fetch recommendations (products in the same categories, excluding the current one)
  const categoryIds = product.categories.map((c: any) => c.id);
  
  let recommendations: any[] = [];
  
  if (categoryIds.length > 0) {
    recommendations = await prisma.product.findMany({
      where: {
        status: 'PUBLISHED',
        id: { not: id },
        categories: { some: { id: { in: categoryIds } } }
      },
      take: 4,
      orderBy: { createdAt: 'desc' }
    });
  }

  // Fallback: If no related products found, just fetch latest 4 products
  if (recommendations.length === 0) {
    recommendations = await prisma.product.findMany({
      where: {
        status: 'PUBLISHED',
        id: { not: id },
      },
      take: 4,
      orderBy: { createdAt: 'desc' }
    });
  }

  return (
    <PDPClient 
      product={product} 
      recommendations={recommendations} 
    />
  );
}
