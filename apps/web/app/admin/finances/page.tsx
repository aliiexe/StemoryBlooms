import React from 'react';
import { db } from '@stemory/database';
import styles from '../dashboard.module.css';
import { AdminFinancesClient } from './AdminFinancesClient';

export default async function AdminFinancesPage() {
  const expenses = await db.query.expense.findMany({
    orderBy: (expense, { desc }) => [desc(expense.date)]
  });

  const orders = await db.query.order.findMany({
    where: (order, { eq }) => eq(order.paymentStatus, 'PAID')
  });

  // Since we haven't implemented actual payment processing to mark orders as PAID,
  // we will just sum all orders for demonstration purposes in this phase.
  const allOrders = await db.query.order.findMany();

  // The user requested to exclude delivery fees from revenue since it goes directly to the delivery company.
  const totalDeliveryFees = allOrders.reduce((acc, order) => acc + (order.deliveryFee || 0), 0);
  // Revenue = product sales only (subtotal - discount), never includes delivery fees
  const totalRevenue = allOrders.reduce((acc, order) => acc + Math.max(0, (order.subtotal || 0) - (order.discount || 0)), 0);
  const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
  
  // Net Profit = Product Revenue - Total Expenses
  const netProfit = totalRevenue - totalExpenses;

  return <AdminFinancesClient 
    initialExpenses={expenses} 
    totalRevenue={totalRevenue} 
    totalDeliveryFees={totalDeliveryFees} 
    totalExpenses={totalExpenses} 
    netProfit={netProfit} 
  />;
}
