import React from 'react';
import { db, order, product } from '@stemory/database';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import styles from '../../dashboard.module.css';
import Link from 'next/link';
import { ArrowLeft, User, MapPin, CreditCard, Box } from 'lucide-react';
import { OrderActions } from '../OrderActions';
import DeleteOrderButton from './DeleteOrderButton';

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = await db.query.order.findFirst({
    where: eq(order.id, id),
    with: { 
      customer: true,
      orderItems: true
    }
  });

  if (!o) {
    notFound();
  }

  // Fetch product images for order items
  const itemsWithImages = await Promise.all(o.orderItems.map(async (item) => {
    let imageUrl: string | null = null;
    
    // Check if it's a custom bouquet with an image in configuration
    const config = item.configuration as any;
    if (config?.image) {
      imageUrl = config.image;
    } else if (item.productId) {
      // Fetch product to get its main image
      const prod = await db.query.product.findFirst({
        where: eq(product.id, item.productId)
      });
      if (prod?.images && prod.images.length > 0) {
        imageUrl = prod.images[0];
      }
    }
    
    return {
      ...item,
      imageUrl
    };
  }));

  const address = o.deliveryAddress as any;
  const addressString = address 
    ? `${address.addressLine1 || ''} ${address.addressLine2 || ''}, ${address.city || ''}, ${address.postalCode || ''}`.trim().replace(/^[,\s]+|[,\s]+$/g, '')
    : 'No address provided';

  return (
    <div className={styles.dashboard}>
      <header className={styles.pageHeader}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Link href="/admin/orders" style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
              <ArrowLeft size={16} style={{ marginRight: '4px' }} />
              Back to Orders
            </Link>
          </div>
          <h1 className={styles.pageTitle}>Order #{o.orderNumber}</h1>
          <p className={styles.pageSubtitle}>Placed on {new Date(o.createdAt).toLocaleString()}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <OrderActions orderId={o.id} currentStatus={o.status} sentToInfinidis={o.sentToInfinidis} />
          <DeleteOrderButton orderId={o.id} />
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Column: Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className={styles.card}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Order Items</h2>
              <span className={styles.sectionHint}>{itemsWithImages.length} items</span>
            </div>
            <div style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsWithImages.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '6px', backgroundColor: '#F3F4F6', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <Box size={20} color="#9CA3AF" />
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontWeight: 500 }}>{item.productName}</span>
                            {item.configuration && (item.configuration as any).color && (
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Color: {(item.configuration as any).color}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>{item.unitPrice} MAD</td>
                      <td>{item.quantity}</td>
                      <td style={{ fontWeight: 600 }}>{item.totalPrice} MAD</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '300px', marginLeft: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Subtotal</span>
                  <span>{o.subtotal} MAD</span>
                </div>
                {o.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#B42318' }}>
                    <span>Discount</span>
                    <span>-{o.discount} MAD</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '1.1rem', paddingTop: '0.75rem', borderTop: '1px solid #E5E7EB', marginTop: '0.25rem' }}>
                  <span>Total</span>
                  <span>{Math.max(0, o.total - o.deliveryFee)} MAD</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Customer & Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Customer Card */}
          <div className={styles.card}>
            <div className={styles.sectionHeader} style={{ paddingBottom: '1rem', borderBottom: '1px solid #F3F4F6' }}>
              <h2 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={18} /> Customer Info
              </h2>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ fontWeight: 600, marginBottom: '2px' }}>
                  {o.customer ? `${o.customer.firstName} ${o.customer.lastName}` : 'Guest Customer'}
                </div>
                {o.customer?.email && <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{o.customer.email}</div>}
                {o.customer?.phone && <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{o.customer.phone}</div>}
              </div>
              
              {o.customer?.socialHandle && (
                <div style={{ paddingTop: '1rem', borderTop: '1px solid #F3F4F6' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Social</div>
                  <div style={{ fontSize: '0.9rem' }}>{o.customer.socialHandle}</div>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Card */}
          <div className={styles.card}>
            <div className={styles.sectionHeader} style={{ paddingBottom: '1rem', borderBottom: '1px solid #F3F4F6' }}>
              <h2 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={18} /> Delivery
              </h2>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Address</div>
                <div style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>{addressString || 'N/A'}</div>
              </div>
              
              {address?.phone && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Delivery Phone</div>
                  <div style={{ fontSize: '0.9rem' }}>{address.phone}</div>
                </div>
              )}
              
              {o.notes && (
                <div style={{ paddingTop: '1rem', borderTop: '1px solid #F3F4F6' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Order Notes</div>
                  <div style={{ fontSize: '0.9rem', backgroundColor: '#F9FAFB', padding: '0.75rem', borderRadius: '6px' }}>{o.notes}</div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Card */}
          <div className={styles.card}>
            <div className={styles.sectionHeader} style={{ paddingBottom: '1rem', borderBottom: '1px solid #F3F4F6' }}>
              <h2 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={18} /> Payment
              </h2>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Status</span>
                <span className={styles.badge} style={{ 
                  backgroundColor: o.paymentStatus === 'PAID' ? '#E8F5E9' : '#FDECEC', 
                  color: o.paymentStatus === 'PAID' ? '#067647' : '#B42318' 
                }}>
                  {o.paymentStatus}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Method</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{o.source || 'Online'}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
