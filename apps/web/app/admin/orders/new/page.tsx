import React from 'react';
import { db, product as productSchema, customer as customerSchema, order as orderSchema, orderItem as orderItemSchema, socialOrderMetadata as socialOrderMetadataSchema, eq } from '@stemory/database';
import { redirect } from 'next/navigation';
import styles from '../../dashboard.module.css';

export default async function NewAssistedOrderPage() {
  const products = await db.query.product.findMany({
    where: (products, { eq }) => eq(products.isAvailable, true)
  });

  async function createAssistedOrder(formData: FormData) {
    'use server';
    
    const source = formData.get('source') as string;
    const customerName = formData.get('customerName') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const productId = formData.get('productId') as string;
    const notes = formData.get('notes') as string;
    const total = parseInt(formData.get('total') as string, 10);

    const product = await db.query.product.findFirst({ 
      where: (p, { eq }) => eq(p.id, productId)
    });
    
    if (!product) throw new Error("Product not found");

    await db.transaction(async (tx) => {
      let customer = await tx.query.customer.findFirst({
        where: (c, { eq }) => eq(c.phone, phoneNumber)
      });
      
      if (customer) {
        const [updated] = await tx.update(customerSchema)
          .set({ firstName: customerName, updatedAt: new Date() })
          .where(eq(customerSchema.id, customer.id))
          .returning();
        customer = updated;
      } else {
        const [inserted] = await tx.insert(customerSchema).values({
          id: crypto.randomUUID(),
          updatedAt: new Date(),
          phone: phoneNumber,
          firstName: customerName,
          lastName: ''
        }).returning();
        customer = inserted;
      }

      const orderNumber = `AST-${Date.now().toString().slice(-6)}`;
      
      const [order] = await tx.insert(orderSchema).values({
        id: crypto.randomUUID(),
        updatedAt: new Date(),
        orderNumber,
        customerId: customer.id,
        status: 'CONFIRMED',
        source: source,
        subtotal: total - 50,
        deliveryFee: 50,
        total: total,
        notes: notes,
        deliveryAddress: { city: 'Assisted Order - TBD', addressLine1: 'TBD' }
      }).returning();

      await tx.insert(orderItemSchema).values({
        id: crypto.randomUUID(),
        updatedAt: new Date(),
        orderId: order.id,
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.basePrice,
        totalPrice: product.basePrice,
      });

      await tx.insert(socialOrderMetadataSchema).values({
        id: crypto.randomUUID(),
        orderId: order.id,
        handle: phoneNumber,
        platform: source
      });
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
