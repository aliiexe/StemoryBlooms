export interface OrderTotalsInput {
  subtotal: number;
  promoCode?: string | null;
  promoDetails?: { type: 'PERCENTAGE' | 'FIXED'; value: number } | null;
  deliveryFee?: number;
}

export interface OrderTotalsResult {
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  total: number;
  appliedPromo: boolean;
}

export function calculateOrderTotals({
  subtotal,
  promoCode,
  promoDetails,
  deliveryFee = 50,
}: OrderTotalsInput): OrderTotalsResult {
  let discountAmount = 0;
  let appliedPromo = false;

  if (promoCode && promoDetails) {
    if (promoDetails.type === 'PERCENTAGE') {
      discountAmount = Math.round(subtotal * (promoDetails.value / 100));
    } else if (promoDetails.type === 'FIXED') {
      discountAmount = promoDetails.value;
    }
    appliedPromo = true;
  }

  const total = Math.max(0, subtotal - discountAmount) + deliveryFee;

  return {
    subtotal,
    discountAmount,
    deliveryFee,
    total,
    appliedPromo,
  };
}
