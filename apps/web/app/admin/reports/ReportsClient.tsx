'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart
} from 'recharts';
import styles from '../dashboard.module.css';

interface LineData {
  date: string;
  revenue: number;
  orders: number;
}

interface PieData {
  name: string;
  value: number;
}

interface ReportsClientProps {
  lineData: LineData[];
  pieData: PieData[];
}

const COLORS = ['#1B5E20', '#4CAF50', '#81C784', '#A5D6A7', '#C8E6C9', '#E8F5E9'];

export function ReportsClient({ lineData, pieData }: ReportsClientProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Revenue Over Time Chart */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>
          Revenue Over Time
        </h3>
        <div style={{ width: '100%', height: 350, marginTop: '1.5rem' }}>
          <ResponsiveContainer>
            <AreaChart data={lineData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} dy={10} />
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
              <Area type="monotone" dataKey="revenue" stroke="var(--brand-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--brand-primary)' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        {/* Orders Over Time Chart */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            Orders Over Time
          </h3>
          <div style={{ width: '100%', height: 300, marginTop: '1.5rem' }}>
            <ResponsiveContainer>
              <LineChart data={lineData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} dy={10} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#6B7280' }} 
                  dx={-10} 
                  width={40}
                />
                <Tooltip 
                  cursor={{ stroke: 'rgba(76,175,80,0.2)', strokeWidth: 2, strokeDasharray: '4 4' }} 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)' }} 
                />
                <Line type="monotone" dataKey="orders" stroke="#4CAF50" strokeWidth={3} activeDot={{ r: 6, strokeWidth: 0, fill: '#4CAF50' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            Order Status Distribution
          </h3>
          <div style={{ width: '100%', height: 300, marginTop: '1.5rem' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)' }} 
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
