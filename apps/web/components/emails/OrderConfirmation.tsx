import * as React from 'react';

interface CartItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderConfirmationProps {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  city: string;
  address: string;
  items: CartItem[];
}

export function OrderConfirmationTemplate({
  customerName,
  customerEmail,
  orderNumber,
  subtotal,
  deliveryFee,
  discount,
  total,
  city,
  address,
  items,
}: OrderConfirmationProps) {
  return (
    <div style={{ backgroundColor: '#F5F0E8', fontFamily: "'Georgia', 'Times New Roman', serif", padding: '40px 20px', margin: 0 }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-block', backgroundColor: '#fff', borderRadius: '50%', width: '72px', height: '72px', lineHeight: '72px', fontSize: '36px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(95,113,97,0.15)' }}>
            🌸
          </div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#4A5E3A', letterSpacing: '0.5px' }}>
            Stemory Blooms
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#8A7E74', letterSpacing: '2px', textTransform: 'uppercase' }}>
            Handcrafted in Morocco
          </p>
        </div>

        {/* Main card */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(95,113,97,0.10)' }}>

          {/* Green banner */}
          <div style={{ backgroundColor: '#5F7161', padding: '28px 40px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#C8D8C0', letterSpacing: '2px', textTransform: 'uppercase' }}>New Order Received</p>
            <h2 style={{ margin: 0, fontSize: '22px', color: '#FFFFFF', fontWeight: 700 }}>
              Order #{orderNumber}
            </h2>
          </div>

          <div style={{ padding: '36px 40px' }}>

            {/* Greeting */}
            <p style={{ margin: '0 0 8px', fontSize: '16px', color: '#3A3531' }}>
              A new order has been placed on Stemory Blooms.
            </p>
            <p style={{ margin: '0 0 28px', fontSize: '15px', color: '#5A5551', lineHeight: '1.6' }}>
              <strong>Customer:</strong> {customerName}<br />
              <strong>Email:</strong> {customerEmail}<br />
              <strong>Delivery to:</strong> {address}, {city}
            </p>

            {/* Divider */}
            <div style={{ borderTop: '1px solid #EAE6DF', marginBottom: '28px' }} />

            {/* Items */}
            <h3 style={{ margin: '0 0 16px', fontSize: '14px', color: '#8A7E74', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 600 }}>
              Items Ordered
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9F7F3' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: '#8A7E74', fontWeight: 600, letterSpacing: '0.5px', borderRadius: '8px 0 0 8px' }}>Product</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '12px', color: '#8A7E74', fontWeight: 600 }}>Qty</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '12px', color: '#8A7E74', fontWeight: 600, borderRadius: '0 8px 8px 0' }}>Price</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F0EDE8' }}>
                    <td style={{ padding: '12px 14px', fontSize: '14px', color: '#3A3531', fontWeight: 500 }}>{item.name}</td>
                    <td style={{ padding: '12px 14px', fontSize: '14px', color: '#5A5551', textAlign: 'center' }}>×{item.quantity}</td>
                    <td style={{ padding: '12px 14px', fontSize: '14px', color: '#3A3531', textAlign: 'right', fontWeight: 500 }}>{item.price * item.quantity} MAD</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ backgroundColor: '#F9F7F3', borderRadius: '12px', padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '14px', color: '#7A7571' }}>Subtotal</span>
                <span style={{ fontSize: '14px', color: '#3A3531' }}>{subtotal} MAD</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '14px', color: '#7A7571' }}>Delivery Fee</span>
                <span style={{ fontSize: '14px', color: '#3A3531' }}>{deliveryFee} MAD</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '14px', color: '#5F7161' }}>Discount</span>
                  <span style={{ fontSize: '14px', color: '#5F7161' }}>−{discount} MAD</span>
                </div>
              )}
              <div style={{ borderTop: '1px solid #DDD8D0', marginTop: '12px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#3A3531' }}>Total</span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#5F7161' }}>{total} MAD</span>
              </div>
            </div>

            {/* Payment note */}
            <div style={{ marginTop: '24px', padding: '14px 18px', backgroundColor: '#FFF8EC', borderRadius: '10px', borderLeft: '3px solid #D4A853' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#7A6030' }}>
                💳 <strong>Payment method:</strong> Cash on Delivery — collect payment upon handoff.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '32px', paddingBottom: '20px' }}>
          <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#8A7E74' }}>
            Crafted with ♥ in Morocco
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: '#B0A89E' }}>
            © {new Date().getFullYear()} Stemory Blooms · stemoryblooms.com
          </p>
        </div>

      </div>
    </div>
  );
}
