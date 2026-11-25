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

export type CourierShipment = Omit<InfinidisOrderPayload, 'email'>;
export type CourierSubmissionResult = { outcome: 'ACKNOWLEDGED' | 'REJECTED' | 'UNCERTAIN'; error?: string };

export async function submitInfinidisOrder(orderData: CourierShipment): Promise<CourierSubmissionResult> {
  const accountEmail = process.env.INFINIDIS_ACCOUNT_EMAIL;
  if (!accountEmail) return { outcome: 'REJECTED', error: 'Carrier account email is not configured.' };
  try {
    const response = await fetch('https://app.infinidis.ma/sendtoinfinidis.php', {
      method: 'POST', signal: AbortSignal.timeout(15_000), headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ ...orderData, email: accountEmail }),
    });
    const data: unknown = await response.json().catch(() => null);
    const success = data && typeof data === 'object' && 'success' in data ? data.success : undefined;
    if (response.ok && success === true) return { outcome: 'ACKNOWLEDGED' };
    if (response.status < 500 && success === false) return { outcome: 'REJECTED', error: 'The carrier explicitly rejected this registration. Verify the shipment details before retrying.' };
    return { outcome: 'UNCERTAIN', error: 'The carrier did not provide a definite acknowledgment. Verify its dashboard before retrying.' };
  } catch {
    return { outcome: 'UNCERTAIN', error: 'The request timed out or its result was lost. Check whether the carrier already registered this order.' };
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
      signal: AbortSignal.timeout(10_000),
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
      signal: AbortSignal.timeout(15_000),
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
    return response.ok && data?.success === true;
  } catch (err) {
    console.error(`Error updating tracking state for ${orderCode}:`, err);
    return false;
  }
}
