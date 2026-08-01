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

  // Calculate Trailing 7 days sales data
  const salesData = [];
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const recentSales = await prisma.order.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { createdAt: true, total: true }
  });

  // Group by day
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    // Find all orders that fall on this day
    const daySales = recentSales.filter(o => 
      new Date(o.createdAt).toDateString() === d.toDateString()
    ).reduce((sum, o) => sum + o.total, 0);

    salesData.push({ name: dayStr, sales: daySales });
  }

  // Get low stock materials
  const lowStock = await prisma.material.findMany({
    where: { quantity: { lt: 20 } },
    take: 5,
    orderBy: { quantity: 'asc' }
  });

  // Get recent admin alerts
  const socialInquiries = await prisma.adminInboxEvent.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  });

  // Calculate top products by aggregating OrderItem
  const orderItems = await prisma.orderItem.groupBy({
    by: ['productName'],
    _sum: {
      quantity: true
    },
    orderBy: {
      _sum: {
        quantity: 'desc'
      }
    },
    take: 5
  });

  const topProducts = orderItems.map(item => ({
    name: item.productName,
    sold: item._sum.quantity || 0
  }));

  return (
    <DashboardClient 
      metrics={metrics}
      recentOrders={recentOrders}
      salesData={salesData}
      topProducts={topProducts}
      lowStock={lowStock}
      socialInquiries={socialInquiries}
    />
  );
}
