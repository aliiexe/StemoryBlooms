import { PrismaClient } from '@stemory/database';
import DashboardClient from './DashboardClient';

const prisma = new PrismaClient();

export default async function AdminDashboardPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch actual data
  const ordersTodayCount = await prisma.order.count({
    where: { createdAt: { gte: today } }
  });

  const [awaitingCount, productionCount, readyCount, completedCount] = await Promise.all([
    prisma.order.count({ where: { status: 'NEW' } }),
    prisma.order.count({ where: { status: 'IN_PRODUCTION' } }),
    prisma.order.count({ where: { status: 'READY' } }),
    prisma.order.count({ where: { status: 'COMPLETED' } })
  ]);

  const ordersToday = await prisma.order.findMany({
    where: { createdAt: { gte: today } },
    select: { total: true }
  });

  const revenueToday = ordersToday.reduce((sum, order) => sum + order.total, 0);

  const metrics = [
    { label: 'Orders Today', value: ordersTodayCount.toString(), sub: 'Live', positive: true },
    { label: 'Awaiting', value: awaitingCount.toString() },
    { label: 'In Production', value: productionCount.toString() },
    { label: 'Ready', value: readyCount.toString() },
    { label: 'Completed', value: completedCount.toString() },
    { label: 'Revenue', value: `${revenueToday} MAD`, sub: 'Live', positive: true },
  ];

  const recentDbOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { customer: true }
  });

  const statusColors: any = {
    'NEW': { bg: '#FFF8E1', fg: '#F57F17' },
    'IN_PRODUCTION': { bg: '#FCE4EC', fg: '#880E4F' },
    'READY': { bg: '#E8F5E9', fg: '#1B5E20' },
    'COMPLETED': { bg: '#F5F5F5', fg: '#616161' }
  };

  const recentOrders = recentDbOrders.map(o => ({
    id: o.orderNumber,
    name: `${o.customer.firstName} ${o.customer.lastName}`,
    total: `${o.total} MAD`,
    status: o.status,
    bg: statusColors[o.status]?.bg || '#E0F7FA',
    fg: statusColors[o.status]?.fg || '#006064'
  }));

  // Dummy sales data for the chart since generating a 7-day trailing graph requires more complex group-by
  const salesData = [
    { name: 'Day 1', sales: 1500 },
    { name: 'Day 2', sales: 2300 },
    { name: 'Day 3', sales: 2000 },
    { name: 'Day 4', sales: 3400 },
    { name: 'Day 5', sales: 2800 },
    { name: 'Day 6', sales: 4200 },
    { name: 'Today', sales: revenueToday },
  ];

  const topProducts = [
    { name: 'Classic Lavender', sold: 12 },
    { name: 'Mini Bouquet', sold: 8 },
    { name: 'Signature Pink', sold: 6 },
    { name: 'Single Bloom', sold: 5 },
  ];

  return (
    <DashboardClient 
      metrics={metrics}
      recentOrders={recentOrders}
      salesData={salesData}
      topProducts={topProducts}
    />
  );
}
