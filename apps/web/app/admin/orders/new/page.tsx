import React from 'react';
import { db, eq, customer, order, orderItem, product, socialOrderMetadata } from '@stemory/database';
import { redirect } from 'next/navigation';
import styles from '../../dashboard.module.css';
import crypto from 'crypto';
import { parseIntegerInput } from '../../../../lib/form-values';

export default async function NewAssistedOrderPage() {
  const products = await db.query.product.findMany({
    where: eq(product.isAvailable, true)
  });

  async function createAssistedOrder(formData: FormData) {
    'use server';
    
    const source = formData.get('source') as string;
    const customerName = formData.get('customerName') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const productId = formData.get('productId') as string;
    const notes = formData.get('notes') as string;
    const total = parseIntegerInput(formData.get('total') as string | null);

    const productRecord = await db.query.product.findFirst({ where: eq(product.id, productId) });
    if (!productRecord || total === null) throw new Error("Product not found or total is invalid");

    const activeDeliveryCompany = await db.query.deliveryCompany.findFirst({ where: (table, { eq }) => eq(table.isActive, true) });
    const deliveryFee = activeDeliveryCompany?.fee ?? 50;

    await db.transaction(async (tx) => {
      const [existingCustomer] = await tx.select().from(customer).where(eq(customer.phone, phoneNumber));
      
      let customerId: string;
      if (existingCustomer) {
        await tx.update(customer).set({ firstName: customerName, updatedAt: new Date() }).where(eq(customer.id, existingCustomer.id));
        customerId = existingCustomer.id;
      } else {
        const [newCustomer] = await tx.insert(customer).values({ 
          id: crypto.randomUUID(),
          firstName: customerName,
          lastName: '', 
          phone: phoneNumber,
          updatedAt: new Date()
        }).returning({ id: customer.id });
        customerId = newCustomer.id;
      }

      const orderNumber = `AST-${Date.now().toString().slice(-6)}`;
      
      const [createdOrder] = await tx.insert(order).values({
        id: crypto.randomUUID(),
        orderNumber,
        customerId,
        status: 'CONFIRMED',
        source: source,
        subtotal: total - deliveryFee,
        deliveryFee,
        discount: 0,
        total: total,
        notes: notes,
        deliveryAddress: { city: 'Assisted Order - TBD', addressLine1: 'TBD' },
        updatedAt: new Date()
      }).returning({ id: order.id });

      await tx.insert(orderItem).values({
        id: crypto.randomUUID(),
        orderId: createdOrder.id,
        productId: productRecord.id,
        productName: productRecord.name,
        quantity: 1,
        unitPrice: productRecord.basePrice,
        totalPrice: productRecord.basePrice,
        updatedAt: new Date()
      });

      if (['INSTAGRAM', 'TIKTOK'].includes(source)) {
        await tx.insert(socialOrderMetadata).values({
          id: crypto.randomUUID(),
          orderId: createdOrder.id,
          handle: customerName,
          platform: source
        });
      }
    });

    redirect('/admin');
  }

  return (
    <div className={styles.dashboard}>
      <header className={styles.shopHeader} style={{ padding: '0', marginBottom: '2rem' }}>
        <h1 className={styles.shopTitle} style={{ fontSize: '1.75rem' }}>Create Assisted Order</h1>
      </header>

      <div className={styles.card} style={{ maxWidth: '600px' }}>
        <form action={createAssistedOrder} className={styles.form}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#5A5551' }}>Source</label>
            <select name="source" required className={styles.input}>
              <option value="INSTAGRAM">Instagram</option>
              <option value="TIKTOK">TikTok</option>
              <option value="PHONE">Phone / WhatsApp</option>
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#5A5551' }}>Customer Name</label>
            <input name="customerName" required placeholder="e.g. Imane F." className={styles.input} />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#5A5551' }}>Phone Number</label>
            <input name="phoneNumber" required placeholder="e.g. 06 98 76 54 32" className={styles.input} />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#5A5551' }}>Product</label>
            <select name="productId" required className={styles.input}>
              <option value="">Select a product...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.basePrice} MAD)</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#5A5551' }}>Customizations & Notes</label>
            <textarea name="notes" rows={4} placeholder="She wants a mini bouquet in pink and white with a card..." className={styles.input}></textarea>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#5A5551' }}>Final Agreed Total (MAD)</label>
            <input name="total" type="number" required placeholder="e.g. 200" className={styles.input} />
          </div>

          <button type="submit" className={styles.submitBtn}>Save Order</button>
        </form>
      </div>
    </div>
  );
}
