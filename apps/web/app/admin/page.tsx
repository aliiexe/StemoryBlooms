import { db } from '@stemory/database';
import { order, material, adminInboxEvent, orderItem, customer } from '@stemory/database/schema';
import { count, sum, eq, gte, lt, desc, inArray, sql } from 'drizzle-orm';
import DashboardClient from './DashboardClient';

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('en-MA', {
    style: 'currency',
    currency: 'MAD',
    maximumFractionDigits: 0
  }).format(amount);
};

export default async function AdminDashboardPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch actual data
  const ordersTodayResult = await db.select({ count: count() }).from(order).where(
    sql`${order.createdAt} >= ${today} AND ${order.status} != 'CANCELLED'`
  );
  const ordersTodayCount = ordersTodayResult[0].count;

  const [awaitingResult, productionResult, readyResult, completedResult, customersResult, allOrdersResult] = await Promise.all([
    db.select({ count: count() }).from(order).where(eq(order.status, 'NEW')),
    db.select({ count: count() }).from(order).where(eq(order.status, 'IN_PRODUCTION')),
    db.select({ count: count() }).from(order).where(eq(order.status, 'READY')),
    db.select({ count: count() }).from(order).where(inArray(order.status, ['COMPLETED', 'DELIVERED'])),
    db.select({ count: count() }).from(customer),
    db.select({ 
      count: count(), 
      totalRevenue: sql<number>`SUM(GREATEST(0, ${order.total} - ${order.deliveryFee}))` 
    }).from(order).where(sql`${order.status} != 'CANCELLED'`)
  ]);
  const awaitingCount = awaitingResult[0].count;
  const productionCount = productionResult[0].count;
  const readyCount = readyResult[0].count;
  const completedCount = completedResult[0].count;
  const totalCustomers = customersResult[0].count;
  const allTimeRevenue = Number(allOrdersResult[0].totalRevenue) || 0;
  const allTimeCount = allOrdersResult[0].count;
  const aov = allTimeCount > 0 ? allTimeRevenue / allTimeCount : 0;

  const ordersToday = await db.query.order.findMany({
    where: (table, { and, gte, ne }) => and(
      gte(table.createdAt, today),
      ne(table.status, 'CANCELLED')
    ),
    columns: { total: true, deliveryFee: true }
  });

  const revenueToday = ordersToday.reduce((sum, order) => sum + Math.max(0, order.total - order.deliveryFee), 0);

  const metrics = [
    { label: 'Revenue Today', value: formatMoney(revenueToday), sub: 'Live', positive: true },
    { label: 'Orders Today', value: ordersTodayCount.toString(), sub: 'Live', positive: true },
    { label: 'AOV', value: formatMoney(aov) },
    { label: 'Customers', value: totalCustomers.toString() },
    { label: 'Awaiting', value: awaitingCount.toString() },
    { label: 'In Production', value: productionCount.toString() },
    { label: 'Ready', value: readyCount.toString() },
    { label: 'Completed', value: completedCount.toString() },
  ];

  const recentDbOrders = await db.query.order.findMany({
    limit: 5,
    orderBy: (table, { desc }) => [desc(table.createdAt)],
    with: { customer: true }
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
    total: formatMoney(Math.max(0, o.total - o.deliveryFee)),
    status: o.status,
    bg: statusColors[o.status]?.bg || '#E0F7FA',
    fg: statusColors[o.status]?.fg || '#006064'
  }));

  // Calculate Trailing 7 days sales data
  const salesData: { name: string; sales: number }[] = [];
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const recentSales = await db.query.order.findMany({
    where: (table, { gte }) => gte(table.createdAt, sevenDaysAgo),
    columns: { createdAt: true, total: true, deliveryFee: true }
  });

  // Group by day
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    // Find all orders that fall on this day
    const daySales = recentSales.filter(o => 
      new Date(o.createdAt).toDateString() === d.toDateString()
    ).reduce((sum, o) => sum + Math.max(0, o.total - o.deliveryFee), 0);

    salesData.push({ name: dayStr, sales: daySales });
  }

  // Get low stock materials
  const lowStock = await db.query.material.findMany({
    where: (table, { and, isNotNull, lte }) => and(isNotNull(table.lowStockThreshold), lte(table.quantity, table.lowStockThreshold!)),
    limit: 5,
    orderBy: (table, { asc }) => [asc(table.quantity)]
  });

  // Get active deliveries (orders that are SHIPPED or PROCESSING)
  const activeDeliveries = await db.query.order.findMany({
    where: (table, { inArray }) => inArray(table.status, ['PROCESSING', 'SHIPPED', 'READY']),
    limit: 5,
    orderBy: (table, { desc }) => [desc(table.updatedAt)],
    with: { customer: true }
  });

  // Calculate top products by aggregating OrderItem
  const orderItemsResult = await db.select({
    productName: orderItem.productName,
    quantity: sum(orderItem.quantity)
  })
  .from(orderItem)
  .groupBy(orderItem.productName)
  .orderBy(desc(sum(orderItem.quantity)))
  .limit(5);

  const topProducts = orderItemsResult.map(item => ({
    name: item.productName,
    sold: Number(item.quantity) || 0
  }));

  return (
    <DashboardClient 
      metrics={metrics}
      recentOrders={recentOrders}
      salesData={salesData}
      topProducts={topProducts}
      lowStock={lowStock}
      activeDeliveries={activeDeliveries}
    />
  );
}
