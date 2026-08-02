import React from 'react';
import { PrismaClient } from '@stemory/database';
import { redirect } from 'next/navigation';
import styles from '../../dashboard.module.css';

const prisma = new PrismaClient();

export default async function NewAssistedOrderPage() {
  const products = await prisma.product.findMany({
    where: { isAvailable: true }
  });

  async function createAssistedOrder(formData: FormData) {
    'use server';
    
    const source = formData.get('source') as string;
    const customerName = formData.get('customerName') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const productId = formData.get('productId') as string;
    const notes = formData.get('notes') as string;
    const total = parseInt(formData.get('total') as string, 10);

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error("Product not found");

    await prisma.$transaction(async (tx: any) => {
      const customer = await tx.customer.upsert({
        where: { phone: phoneNumber },
        update: { firstName: customerName },
        create: { firstName: customerName, lastName: '', phone: phoneNumber }
      });

      const orderNumber = `AST-${Date.now().toString().slice(-6)}`;
      
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: customer.id,
          status: 'CONFIRMED',
          source: source,
          subtotal: total - 50,
          deliveryFee: 50,
          total: total,
          notes: notes,
          deliveryAddress: { city: 'Assisted Order - TBD', addressLine1: 'TBD' },
          items: {
            create: [{
              productId: product.id,
              productName: product.name,
              quantity: 1,
              unitPrice: product.basePrice,
              totalPrice: product.basePrice,
            }]
          }
        }
      });

      await tx.socialOrderMetadata.create({
        data: {
          orderId: order.id,
          handle: phoneNumber, // Can be overridden if needed
          platform: source
        }
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
