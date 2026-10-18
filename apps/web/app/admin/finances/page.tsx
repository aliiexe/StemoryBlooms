import { assertAdmin } from '@/lib/user-sync';
import React from 'react';
import { db } from '@stemory/database';
import styles from '../dashboard.module.css';
import { AdminFinancesClient } from './AdminFinancesClient';

export default async function AdminFinancesPage() {
  await assertAdmin();
  const expenses = await db.query.expense.findMany({
    orderBy: (expense, { desc }) => [desc(expense.date)]
  });

  const orders = await db.query.order.findMany({
    where: (order, { eq }) => eq(order.paymentStatus, 'PAID')
  });

  // Collection is recorded explicitly; fulfillment does not prove cash receipt.
  const collected = orders.filter(value => value.status !== 'CANCELLED');
  const totalDeliveryFees = collected.reduce((sum, value) => sum + value.deliveryFee, 0);
  const totalRevenue = collected.reduce((sum, value) => sum + Math.max(0, value.total - value.deliveryFee), 0);
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
