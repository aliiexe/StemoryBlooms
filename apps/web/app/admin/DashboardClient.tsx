"use client";

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, PackageSearch } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './dashboard.module.css';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function DashboardClient({ 

  metrics, 
  recentOrders, 
  salesData,
  topProducts,
  lowStock,
  activeDeliveries
}: {
  metrics: any[];
  recentOrders: any[];
  salesData: any[];
  topProducts: any;
  lowStock: any;
  activeDeliveries: any;
}) {
  return (
    <motion.div 
      className={styles.dashboard}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Metrics */}
      <motion.div className={styles.metricsGrid} variants={itemVariants}>
        {metrics.map((m, i) => (
          <div key={i} className={styles.metricCard}>
            <span className={styles.metricLabel}>{m.label}</span>
            <span className={styles.metricValue}>{m.value}</span>
            {m.sub && <span className={`${styles.metricSub} ${m.positive ? styles.positive : ''}`}>{m.sub}</span>}
          </div>
        ))}
      </motion.div>

      <div className={styles.mainGrid}>
        {/* Left Column */}
        <div className={styles.leftCol}>
          <motion.div className={styles.midGrid} variants={itemVariants}>
            {/* Recent Orders */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Recent Orders</h3>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Order</th><th>Customer</th><th>Total</th><th>Status</th>
                  </tr>
                </thead>
                <tbody style={{ borderSpacing: '0 8px' }}>
                  {recentOrders.map((o, i) => {
                    const initials = o.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
                    return (
                      <tr key={i} style={{ background: '#F9FAFB', borderRadius: '8px' }}>
                        <td style={{ padding: '12px', fontWeight: 600, color: '#111827', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}>{o.id}</td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-primary), #4CAF50)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>
                              {initials}
                            </div>
                            <span style={{ fontWeight: 500, color: '#374151' }}>{o.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px', fontWeight: 600, color: '#111827' }}>{o.total}</td>
                        <td style={{ padding: '12px', borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}>
                          <span className={styles.badge} style={{ backgroundColor: o.bg, color: o.fg, padding: '4px 10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>{o.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Sales Chart */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Sales Overview</h3>
              <div className={styles.chartWrap}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} dy={10} />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#6B7280' }} 
                      tickFormatter={(val) => new Intl.NumberFormat('en-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(val)} 
                      dx={-10} 
                      width={80}
                    />
                    <Tooltip 
                      cursor={{ stroke: 'rgba(27,94,32,0.2)', strokeWidth: 2, strokeDasharray: '4 4' }} 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)' }}
                      formatter={(val: any) => [new Intl.NumberFormat('en-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(Number(val)), 'Revenue']}
                    />
                    <Area type="monotone" dataKey="sales" stroke="var(--brand-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--brand-primary)' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>

          <motion.div className={styles.midGrid} variants={itemVariants}>
            {/* Top Bouquets */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PackageSearch size={18} color="var(--brand-primary)" />
                Top Bouquets
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                {topProducts.map((p: any, i: number) => {
                  const maxSold = Math.max(...topProducts.map((tp: any) => tp.sold));
                  const percentage = maxSold > 0 ? (p.sold / maxSold) * 100 : 0;
                  return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ fontWeight: 500, color: '#374151' }}>{p.name}</span>
                        <span style={{ color: '#6B7280', fontWeight: 600 }}>{p.sold} sold</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: '#F3F4F6', borderRadius: '99px', overflow: 'hidden' }}>
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          style={{ height: '100%', background: 'linear-gradient(90deg, #1B5E20, #4CAF50)', borderRadius: '99px' }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Low Stock */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#B91C1C' }}>
                <AlertTriangle size={18} color="#B91C1C" />
                Low Stock Alerts
              </h3>
              <ul className={styles.statList} style={{ marginTop: '12px' }}>
                {lowStock.map((item: any, i: number) => (
                  <li key={i} style={{ padding: '10px 12px', background: '#FEF2F2', borderRadius: '8px', border: '1px solid #FEE2E2', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, color: '#991B1B' }}>{item.name}</span> 
                    <strong style={{ color: '#DC2626', background: '#FEE2E2', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>{item.quantity} left</strong>
                  </li>
                ))}
                {lowStock.length === 0 && <li style={{ color: '#10B981', padding: '12px', background: '#ECFDF5', borderRadius: '8px', textAlign: 'center', fontWeight: 500 }}>All stock levels healthy ✨</li>}
              </ul>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Social / Deliveries */}
        <motion.div className={styles.rightCol} variants={itemVariants}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Active Deliveries</h3>
            <table className={styles.table}>
              <thead><tr><th>Order</th><th>Status</th></tr></thead>
              <tbody style={{ borderSpacing: '0 8px' }}>
                {activeDeliveries.map((s: any, i: number) => {
                  const initials = s.customer.firstName[0] + (s.customer.lastName ? s.customer.lastName[0] : '');
                  return (
                    <tr key={i} style={{ background: '#F9FAFB', borderRadius: '8px' }}>
                      <td style={{ padding: '12px', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #1E3A8A, #3B82F6)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                            {initials.toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.9rem' }}>{s.orderNumber}</div>
                            <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>{s.customer.firstName} {s.customer.lastName}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px', borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}>
                        <span className={styles.badge} style={{ 
                          backgroundColor: s.status === 'SHIPPED' ? '#EFF6FF' : '#FFFBEB', 
                          color: s.status === 'SHIPPED' ? '#1D4ED8' : '#D97706',
                          padding: '4px 10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {activeDeliveries.length === 0 && (
                  <tr><td colSpan={2} style={{ textAlign: 'center', color: '#6B7280', padding: '24px 0', background: '#F9FAFB', borderRadius: '8px' }}>No active deliveries.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Assisted Orders</h3>
            <p style={{ color: '#7A7571', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: 1.5 }}>
              Received an order via Instagram or TikTok? Enter it manually to keep stock and reporting synchronized.
            </p>
            <a href="/admin/orders/new" className={styles.submitBtn} style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
              Create Assisted Order
            </a>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
