"use client";

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MessageCircle, Smartphone } from 'lucide-react';
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
                <tbody>
                  {recentOrders.map((o, i) => (
                    <tr key={i}>
                      <td>{o.id}</td>
                      <td>{o.name}</td>
                      <td>{o.total}</td>
                      <td><span className={styles.badge} style={{ backgroundColor: o.bg, color: o.fg }}>{o.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Sales Chart */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Sales Overview</h3>
              <div className={styles.chartWrap}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAE6DF" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#7A7571' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#7A7571' }} tickFormatter={(val) => `${val / 1000}k`} dx={-10} />
                    <Tooltip cursor={{ stroke: 'var(--border-subtle)', strokeWidth: 1 }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Line type="monotone" dataKey="sales" stroke="var(--brand-primary)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'white', stroke: 'var(--brand-primary)' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>

          <motion.div className={styles.midGrid} variants={itemVariants}>
            {/* Top Bouquets */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Top Bouquets</h3>
              <ul className={styles.statList}>
                {topProducts.map((p, i) => (
                  <li key={i}><span>{p.name}</span> <strong>{p.sold} sold</strong></li>
                ))}
              </ul>
            </div>

            {/* Low Stock */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Low Stock Alerts</h3>
              <ul className={styles.statList}>
                {lowStock.map((item: any, i: number) => (
                  <li key={i}>
                    <span>{item.name}</span> 
                    <strong style={{ color: '#880E4F' }}>{item.quantity} left</strong>
                  </li>
                ))}
                {lowStock.length === 0 && <li style={{ color: '#7A7571' }}>All stock levels healthy.</li>}
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
              <tbody>
                {activeDeliveries.map((s: any, i: number) => (
                  <tr key={i}>
                    <td>
                      <div style={{ fontWeight: 500, color: '#3A3531' }}>{s.orderNumber}</div>
                      <div style={{ fontSize: '0.8rem', color: '#7A7571' }}>{s.customer.firstName} {s.customer.lastName}</div>
                    </td>
                    <td>
                      <span className={styles.badge} style={{ 
                        backgroundColor: s.status === 'SHIPPED' ? '#E3F2FD' : '#FFF8E1', 
                        color: s.status === 'SHIPPED' ? '#1565C0' : '#F57F17' 
                      }}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {activeDeliveries.length === 0 && (
                  <tr><td colSpan={2} style={{ textAlign: 'center', color: '#7A7571' }}>No active deliveries.</td></tr>
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
