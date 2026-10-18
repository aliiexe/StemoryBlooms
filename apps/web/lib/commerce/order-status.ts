export const ORDER_STATUS_LABELS: Record<string, string> = {
  NEW: 'New', CONFIRMED: 'Confirmed', IN_PRODUCTION: 'In production', READY: 'Ready',
  SHIPPED: 'Shipped', DELIVERED: 'Delivered', COMPLETED: 'Completed', PROCESSING: 'In production', CANCELLED: 'Cancelled',
};

const transitions: Record<string, readonly string[]> = {
  NEW: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_PRODUCTION', 'READY', 'CANCELLED'],
  IN_PRODUCTION: ['READY', 'CANCELLED'],
  PROCESSING: ['READY', 'CANCELLED'],
  READY: ['SHIPPED', 'DELIVERED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'], DELIVERED: [], COMPLETED: [], CANCELLED: ['CONFIRMED'],
};

export function nextOrderStatuses(status: string) { return transitions[status] || []; }
export function canTransitionOrder(from: string, to: string) { return Boolean(transitions[from] && (from === to || transitions[from].includes(to))); }
