import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@stemory/database';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AccountPage() {
  const user = await currentUser();
  if (!user) {
    redirect('/sign-in');
  }

  const primaryEmail = user.emailAddresses[0]?.emailAddress;

  const customer = primaryEmail 
    ? await prisma.customer.findUnique({
        where: { email: primaryEmail },
        include: { addresses: true }
      })
    : null;

  const orders = customer
    ? await prisma.order.findMany({
        where: { customerId: customer.id },
        orderBy: { createdAt: 'desc' },
        include: { items: true }
      })
    : [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'MAD' }).format(amount / 100);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '4rem 2rem' }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.5rem', color: 'var(--brand-primary)', marginBottom: '0.5rem' }}>
          Welcome back, {user.firstName || 'there'}
        </h1>
        <p style={{ color: '#7A7571' }}>{primaryEmail}</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3rem' }}>
        <section>
          <h2 style={{ fontSize: '1.5rem', borderBottom: '1px solid #EAE6DF', paddingBottom: '1rem', marginBottom: '1.5rem', color: 'var(--brand-primary)' }}>
            Order History
          </h2>
          
          {orders.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {orders.map(order => (
                <div key={order.id} style={{ border: '1px solid #EAE6DF', borderRadius: '12px', padding: '1.5rem', backgroundColor: 'var(--surface-primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Order #{order.orderNumber}</h3>
                      <p style={{ color: '#7A7571', fontSize: '0.9rem' }}>Placed on {formatDate(order.createdAt)}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{formatCurrency(order.total)}</p>
                      <span style={{ display: 'inline-block', marginTop: '0.5rem', padding: '4px 8px', backgroundColor: '#F5F5F5', borderRadius: '4px', fontSize: '0.8rem', color: '#616161', fontWeight: 500 }}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ borderTop: '1px solid #F5F5F5', paddingTop: '1rem' }}>
                    <p style={{ fontSize: '0.9rem', color: '#4A4A4A', marginBottom: '0.5rem', fontWeight: 500 }}>Items</p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem', color: '#7A7571' }}>
                      {order.items.map(item => (
                        <li key={item.id} style={{ marginBottom: '0.25rem' }}>
                          {item.quantity}x {item.productName}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#FDFBF7', borderRadius: '12px', border: '1px solid #EAE6DF' }}>
              <p style={{ color: '#7A7571', marginBottom: '1.5rem' }}>You haven't placed any orders yet.</p>
              <Link href="/shop" style={{ display: 'inline-block', padding: '0.75rem 1.5rem', backgroundColor: 'var(--brand-primary)', color: 'var(--surface-primary)', textDecoration: 'none', borderRadius: '8px', fontWeight: 500 }}>
                Start Shopping
              </Link>
            </div>
          )}
        </section>

        <section>
          <h2 style={{ fontSize: '1.5rem', borderBottom: '1px solid #EAE6DF', paddingBottom: '1rem', marginBottom: '1.5rem', color: 'var(--brand-primary)' }}>
            Saved Addresses
          </h2>
          
          {customer?.addresses && customer.addresses.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {customer.addresses.map(address => (
                <div key={address.id} style={{ border: '1px solid #EAE6DF', borderRadius: '12px', padding: '1.5rem', backgroundColor: 'var(--surface-primary)' }}>
                  {address.isDefault && <span style={{ display: 'inline-block', marginBottom: '0.5rem', padding: '2px 6px', backgroundColor: '#E8F5E9', color: '#1B5E20', fontSize: '0.75rem', borderRadius: '4px', fontWeight: 600 }}>DEFAULT</span>}
                  <p style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{address.addressLine1}</p>
                  {address.addressLine2 && <p style={{ color: '#7A7571', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{address.addressLine2}</p>}
                  <p style={{ color: '#7A7571', fontSize: '0.9rem' }}>{address.city}{address.zone ? `, ${address.zone}` : ''}</p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#7A7571' }}>No saved addresses found. You can add one during checkout.</p>
          )}
        </section>
      </div>
    </div>
  );
}
