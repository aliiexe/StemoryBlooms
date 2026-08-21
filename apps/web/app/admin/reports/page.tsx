import React from 'react';
import { db, order } from '@stemory/database';
import { desc, eq, gte, sql } from 'drizzle-orm';
import { ReportsClient } from './ReportsClient';
import styles from '../dashboard.module.css';

export default async function ReportsPage() {
  // Fetch orders from the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentOrders = await db.query.order.findMany({
    where: gte(order.createdAt, thirtyDaysAgo),
    orderBy: (t, { asc }) => [asc(t.createdAt)],
  });

  // Calculate metrics
  const totalOrders = recentOrders.length;
  const totalRevenue = recentOrders.reduce((acc, o) => o.status !== 'CANCELLED' ? acc + o.total : acc, 0);
  const cancelledOrders = recentOrders.filter(o => o.status === 'CANCELLED').length;

  // Group by date for the line chart (Revenue & Orders over time)
  const groupedByDate: Record<string, { date: string; revenue: number; orders: number }> = {};
  
  // Group by status for the pie chart
  const statusCounts: Record<string, number> = {};

  for (const o of recentOrders) {
    const dString = o.createdAt.toISOString().split('T')[0];
    
    if (!groupedByDate[dString]) {
      groupedByDate[dString] = { date: dString, revenue: 0, orders: 0 };
    }
    
    if (o.status !== 'CANCELLED') {
      groupedByDate[dString].revenue += o.total;
    }
    groupedByDate[dString].orders += 1;

    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  }

  const lineChartData = Object.values(groupedByDate).sort((a, b) => a.date.localeCompare(b.date));
  
  const pieChartData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.headerArea}>
        <h1 className={styles.pageTitle}>Reports & Analytics</h1>
        <p className={styles.pageSubtitle}>Overview of your store's performance over the last 30 days.</p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>Total Revenue (30d)</div>
          <div className={styles.statValue}>{totalRevenue.toFixed(2)} MAD</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>Total Orders (30d)</div>
          <div className={styles.statValue}>{totalOrders}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>Cancelled Orders (30d)</div>
          <div className={styles.statValue}>{cancelledOrders}</div>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <ReportsClient lineData={lineChartData} pieData={pieChartData} />
      </div>
    </div>
  );
}
