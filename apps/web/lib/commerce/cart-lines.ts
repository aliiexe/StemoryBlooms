import type { CheckoutCartItem } from '@stemory/contracts';

type StoredCartLine = {
  id: string;
  kind?: 'PRODUCT' | 'CUSTOM';
  productId?: string;
  quantity: number;
  configuration?: unknown;
};

// Migrate existing local carts at the boundary; server requests use the strict new contract.
export function checkoutCartLines(items: StoredCartLine[]): CheckoutCartItem[] {
  return items.map(item => {
    if (item.kind === 'CUSTOM' || item.id.startsWith('custom-')) {
      const config = (item.configuration && typeof item.configuration === 'object' ? item.configuration : {}) as Record<string, unknown>;
      const components = config.components && typeof config.components === 'object'
        ? config.components as Record<string, number>
        : Object.fromEntries(Object.entries(config).filter(([key]) => key !== 'cardMessage')) as Record<string, number>;
      return { kind: 'CUSTOM', cartLineId: item.id, quantity: item.quantity,
        configuration: { components, ...(typeof config.cardMessage === 'string' ? { cardMessage: config.cardMessage } : {}) } };
    }
    return { kind: 'PRODUCT', cartLineId: item.id, productId: item.productId || item.id, quantity: item.quantity };
  });
}
