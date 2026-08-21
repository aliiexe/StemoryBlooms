'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calculator, DollarSign, Clock, Package } from 'lucide-react';
import styles from '../dashboard.module.css';

export default function PriceHelperClient() {
  const [materialCost, setMaterialCost] = useState<number | ''>('');
  const [packagingCost, setPackagingCost] = useState<number | ''>('');
  const [timeToMake, setTimeToMake] = useState<number | ''>('');
  const [hourlyWage, setHourlyWage] = useState<number | ''>(50); // Default 50 MAD/hr
  const [profitMargin, setProfitMargin] = useState<number | ''>(30); // Default 30% margin

  const calculations = useMemo(() => {
    const mat = Number(materialCost) || 0;
    const pack = Number(packagingCost) || 0;
    const time = Number(timeToMake) || 0;
    const wage = Number(hourlyWage) || 0;
    const margin = Number(profitMargin) || 0;

    const baseCost = mat + pack;
    const laborCost = time * wage;
    const totalCost = baseCost + laborCost;
    
    // Calculate suggested price based on desired profit margin
    // Margin % = (Price - Cost) / Price
    // Price = Cost / (1 - Margin/100)
    let suggestedPrice = 0;
    if (margin >= 100) {
      suggestedPrice = totalCost * 2; // Fallback if they enter >= 100% margin incorrectly
    } else if (margin > 0) {
      suggestedPrice = totalCost / (1 - (margin / 100));
    } else {
      suggestedPrice = totalCost;
    }

    const profit = suggestedPrice - totalCost;

    return {
      baseCost,
      laborCost,
      totalCost,
      suggestedPrice: Math.ceil(suggestedPrice),
      profit: Math.ceil(profit),
    };
  }, [materialCost, packagingCost, timeToMake, hourlyWage, profitMargin]);

  return (
    <motion.div 
      className={styles.dashboard}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Calculator size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', margin: 0 }}>Price Helper</h1>
          <p style={{ color: '#6B7280', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>Calculate the perfect selling price for your handcrafted items.</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        
        {/* INPUTS */}
        <div className={styles.card} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.8)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             Cost Breakdown
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 500, color: '#374151', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Package size={16} /> Material Cost (MAD)
            </label>
            <input 
              type="number"
              value={materialCost}
              onChange={(e) => setMaterialCost(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g. 150"
              className={styles.inputField}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D1D5DB' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 500, color: '#374151', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Package size={16} /> Packaging Cost (MAD)
            </label>
            <input 
              type="number"
              value={packagingCost}
              onChange={(e) => setPackagingCost(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g. 20"
              className={styles.inputField}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D1D5DB' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 500, color: '#374151', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={16} /> Time to Make (Hours)
              </label>
              <input 
                type="number"
                value={timeToMake}
                onChange={(e) => setTimeToMake(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 2.5"
                step="0.5"
                className={styles.inputField}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D1D5DB' }}
              />
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 500, color: '#374151', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <DollarSign size={16} /> Hourly Wage (MAD/hr)
              </label>
              <input 
                type="number"
                value={hourlyWage}
                onChange={(e) => setHourlyWage(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 50"
                className={styles.inputField}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D1D5DB' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 500, color: '#374151' }}>
              Target Profit Margin (%)
            </label>
            <input 
              type="number"
              value={profitMargin}
              onChange={(e) => setProfitMargin(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g. 30"
              className={styles.inputField}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D1D5DB' }}
            />
            <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: 0 }}>
              The standard retail margin is typically between 30% and 50%.
            </p>
          </div>

        </div>

        {/* RESULTS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className={styles.card} style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '2rem' }}>
            <p style={{ margin: '0 0 0.5rem 0', color: '#065F46', fontSize: '1.1rem', fontWeight: 600 }}>Suggested Retail Price</p>
            <div style={{ fontSize: '3rem', fontWeight: 800, color: '#047857', lineHeight: 1 }}>
              {calculations.suggestedPrice} <span style={{ fontSize: '1.5rem', fontWeight: 600 }}>MAD</span>
            </div>
            <p style={{ margin: '1rem 0 0 0', color: '#065F46', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>Est. Profit</span>
              <span style={{ fontWeight: 700 }}>{calculations.profit} MAD</span>
            </p>
          </div>

          <div className={styles.card} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', margin: '0 0 1rem 0' }}>Cost Summary</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4B5563', fontSize: '0.9rem' }}>
                <span>Materials & Packaging</span>
                <span>{calculations.baseCost} MAD</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4B5563', fontSize: '0.9rem' }}>
                <span>Labor Cost ({timeToMake || 0} hrs @ {hourlyWage || 0})</span>
                <span>{calculations.laborCost} MAD</span>
              </div>
              
              <div style={{ height: '1px', background: '#E5E7EB', margin: '0.5rem 0' }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#111827', fontSize: '1rem', fontWeight: 600 }}>
                <span>Total Break-even Cost</span>
                <span>{calculations.totalCost} MAD</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </motion.div>
  );
}
