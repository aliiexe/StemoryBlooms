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

export async function getInfinidisTrackingState(orderCode: string): Promise<string | null> {
  const accountEmail = process.env.INFINIDIS_ACCOUNT_EMAIL;
  
  if (!accountEmail) {
    return null;
  }

  try {
    const url = new URL('https://app.infinidis.ma/get_state.php');
    url.searchParams.append('email', accountEmail);
    url.searchParams.append('code', orderCode);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    const data = await response.json().catch(() => null);

    if (response.ok && data?.success && data?.state) {
      return data.state;
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching tracking for ${orderCode}:`, error);
    return null;
  }
}

export async function updateInfinidisState(orderCode: string, storeStatus: string): Promise<boolean> {
  const accountEmail = process.env.INFINIDIS_ACCOUNT_EMAIL;
  if (!accountEmail) return false;

  // Map our internal statuses to Infinidis French statuses (best effort based on typical logistics)
  let infinidisState = '';
  switch (storeStatus) {
    case 'CANCELLED': infinidisState = 'Annulé'; break;
    case 'DELIVERED': 
    case 'COMPLETED': infinidisState = 'Livré'; break;
    default: return false; // Don't try to sync intermediate steps, let the courier handle those
  }

  try {
    const response = await fetch('https://app.infinidis.ma/change_state.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email: accountEmail,
        code: orderCode,
        state: infinidisState,
        note: `Updated from Stemory Blooms admin (Status: ${storeStatus})`
      })
    });
    const data = await response.json().catch(() => null);
    return data?.success || false;
  } catch (err) {
    console.error(`Error updating tracking state for ${orderCode}:`, err);
    return false;
  }
}
