import { prisma } from '@stemory/database';
import HomeClient from './HomeClient';



export default async function HomePage() {
  const dbProducts = await prisma.product.findMany({
    where: { status: 'PUBLISHED' },
    take: 4,
    orderBy: { createdAt: 'desc' }
  });

  const featuredProducts = dbProducts.map(p => ({
    id: p.id,
    title: p.name,
    price: p.basePrice,
    imageUrl: '/hero-bouquet.png' // Default fallback image if none provided
  }));

  return <HomeClient featuredProducts={featuredProducts} />;
}
