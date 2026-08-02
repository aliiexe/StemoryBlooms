import * as React from 'react';

interface OrderConfirmationProps {
  customerName: string;
  orderNumber: string;
  total: number;
}

export const OrderConfirmationTemplate: React.FC<Readonly<OrderConfirmationProps>> = ({
  customerName,
  orderNumber,
  total,
}) => (
  <div style={{ fontFamily: 'sans-serif', color: '#3A3531', padding: '40px 20px', backgroundColor: '#FDFBF7' }}>
    <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#FFFFFF', padding: '40px', borderRadius: '12px', border: '1px solid #EAE6DF' }}>
      <h1 style={{ color: '#5F7161', fontSize: '24px', margin: '0 0 20px', textAlign: 'center' }}>
        Stemory Blooms
      </h1>
      
      <p style={{ fontSize: '16px', lineHeight: '1.5' }}>
        Hi <strong>{customerName}</strong>,
      </p>
      
      <p style={{ fontSize: '16px', lineHeight: '1.5' }}>
        Thank you for your order! We are thrilled to craft your everlasting blooms.
        Your order <strong>#{orderNumber}</strong> has been received and is currently being processed by our artisans.
      </p>

      <div style={{ backgroundColor: '#FDFBF7', padding: '20px', borderRadius: '8px', margin: '30px 0' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: '16px' }}>Order Summary</h3>
        <p style={{ margin: '0', fontSize: '14px', color: '#5A5551' }}>
          <strong>Order Number:</strong> {orderNumber}
        </p>
        <p style={{ margin: '10px 0 0', fontSize: '14px', color: '#5A5551' }}>
          <strong>Total Amount:</strong> {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'MAD' }).format(total / 100)}
        </p>
      </div>

      <p style={{ fontSize: '16px', lineHeight: '1.5' }}>
        We will notify you once your order is on its way. If you have any questions, feel free to reply to this email.
      </p>

      <div style={{ borderTop: '1px solid #EAE6DF', marginTop: '40px', paddingTop: '20px', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: '#7A7571', margin: '0' }}>
          Crafted with ♥️ in Morocco.<br />
          Stemory Blooms
        </p>
      </div>
    </div>
  </div>
);
