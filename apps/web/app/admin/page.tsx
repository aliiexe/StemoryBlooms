"use client";

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MessageCircle, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './dashboard.module.css';

const salesData = [
  { name: 'May 16', sales: 1500 },
  { name: 'May 17', sales: 2300 },
  { name: 'May 18', sales: 2000 },
  { name: 'May 19', sales: 3400 },
  { name: 'May 20', sales: 2800 },
  { name: 'May 21', sales: 4200 },
  { name: 'May 22', sales: 4780 },
];

const metrics = [
  { label: 'Orders Today', value: '24', sub: '+12% vs yesterday', positive: true },
  { label: 'Awaiting', value: '8' },
  { label: 'In Production', value: '12' },
  { label: 'Ready', value: '6' },
  { label: 'Completed', value: '18' },
  { label: 'Revenue', value: '4,780 MAD', sub: '+18% vs yesterday', positive: true },
];

const recentOrders = [
  { id: '#5310024', name: 'Sara El', total: '249 MAD', status: 'New Order', bg: '#FFF8E1', fg: '#F57F17' },
  { id: '#5310023', name: 'Youssef A.', total: '199 MAD', status: 'Awaiting', bg: '#E0F7FA', fg: '#006064' },
  { id: '#5310022', name: 'Lina M.', total: '349 MAD', status: 'In Production', bg: '#FCE4EC', fg: '#880E4F' },
  { id: '#5310021', name: 'Fatima Z.', total: '299 MAD', status: 'Ready', bg: '#E8F5E9', fg: '#1B5E20' },
  { id: '#5310020', name: 'Mehdi K.', total: '169 MAD', status: 'Completed', bg: '#F5F5F5', fg: '#616161' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function AdminDashboardPage() {
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
                <li><span>Classic Lavender</span> <strong>12 sold</strong></li>
                <li><span>Mini Bouquet</span> <strong>8 sold</strong></li>
                <li><span>Signature Pink</span> <strong>6 sold</strong></li>
                <li><span>Single Bloom</span> <strong>5 sold</strong></li>
              </ul>
            </div>

            {/* Low Stock */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Low Stock</h3>
              <ul className={styles.statList}>
                <li><span>Lavender Pipe Cleaners</span> <strong>120 pcs</strong></li>
                <li><span>Green Floral Tape</span> <strong>3 rolls</strong></li>
                <li><span>Kraft Paper</span> <strong>8 sheets</strong></li>
                <li><span>Thank You Cards</span> <strong>15 pcs</strong></li>
              </ul>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Social */}
        <motion.div className={styles.rightCol} variants={itemVariants}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Social Inquiries</h3>
            <table className={styles.table}>
              <thead><tr><th>Source</th><th>Customer</th><th>Status</th></tr></thead>
              <tbody>
                {[
                  { icon: <MessageCircle size={16} color="#E1306C" />, user: '@imane.fr', status: 'New' },
                  { icon: <MessageCircle size={16} color="#E1306C" />, user: '@hiba.flower', status: 'Contacted' },
                  { icon: <Smartphone size={16} color="#25D366" />, user: '+212 600...', status: 'New' },
                  { icon: <Smartphone size={16} color="#25D366" />, user: '+212 612...', status: 'Contacted' },
                ].map((s, i) => (
                  <tr key={i}>
                    <td><div style={{ display: 'flex', alignItems: 'center' }}>{s.icon}</div></td>
                    <td>{s.user}</td>
                    <td>
                      <span className={styles.badge} style={{ backgroundColor: s.status === 'New' ? '#E8F5E9' : '#F5F5F5', color: s.status === 'New' ? '#1B5E20' : '#616161' }}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Add Manual Order</h3>
            <form className={styles.form}>
              <select className={styles.input}>
                <option value="ig">Instagram DM</option>
                <option value="tt">TikTok</option>
                <option value="wa">WhatsApp</option>
                <option value="in">In Person</option>
              </select>
              <input className={styles.input} type="text" placeholder="Customer Name" />
              <input className={styles.input} type="text" placeholder="Phone / Handle" />
              <textarea className={styles.input} rows={3} placeholder="Order Details..." />
              <input className={styles.input} type="number" placeholder="Total (MAD)" />
              <button type="button" className={styles.submitBtn}>Save Order</button>
            </form>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
