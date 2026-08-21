import { recordAuditLog } from '@/lib/audit';

interface InfinidisOrderPayload {
  fullname: string;
  email: string; // The store owner's Infinidis email
  code: string;
  product: string;
  qty: number;
  phone: string;
  address: string;
  city: string;
  price: number;
  note?: string;
}

export async function sendOrderToInfinidis(orderData: Omit<InfinidisOrderPayload, 'email'>) {
  const accountEmail = process.env.INFINIDIS_ACCOUNT_EMAIL;
  
  if (!accountEmail) {
    console.error('Missing INFINIDIS_ACCOUNT_EMAIL in environment variables');
    return false;
  }

  const payload: InfinidisOrderPayload = {
    ...orderData,
    email: accountEmail,
  };

  try {
    const response = await fetch('https://app.infinidis.ma/sendtoinfinidis.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => null);

    if (response.ok && data?.success) {
      console.log(`Order ${orderData.code} sent to Infinidis successfully.`);
      
      // Optionally log this success
      await recordAuditLog({
        action: 'UPDATE',
        target: 'ORDER',
        summary: `Order ${orderData.code} automatically submitted to INFINIDIS`,
        details: { orderCode: orderData.code, infinidisResponse: data },
      }).catch(console.error);

      return true;
    } else {
      console.error(`Failed to send order ${orderData.code} to Infinidis:`, data);
      
      await recordAuditLog({
        action: 'UPDATE',
        target: 'ORDER',
        summary: `Failed to submit Order ${orderData.code} to INFINIDIS`,
        details: { orderCode: orderData.code, infinidisResponse: data },
      }).catch(console.error);

      return false;
    }
  } catch (error) {
    console.error(`Error sending order ${orderData.code} to Infinidis:`, error);
    return false;
  }
}
