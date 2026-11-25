/** Shared role names only. Authorization uses the authoritative database role in apps/web/lib/user-sync.ts. */
export const ADMIN_ROLE='ADMIN' as const;
export const CUSTOMER_ROLE='CUSTOMER' as const;
export type StoreRole=typeof ADMIN_ROLE|typeof CUSTOMER_ROLE;
