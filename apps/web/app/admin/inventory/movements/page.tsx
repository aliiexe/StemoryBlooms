import Link from 'next/link';
import { db, sql } from '@stemory/database';
import { assertAdmin } from '@/lib/user-sync';
import { inventorySchemaReady } from '@/lib/commerce/stock-ledger';
import MovementFilters from './MovementFilters';
import styles from '../../dashboard.module.css';
type Row = { id: string; name: string; kind: string; quantity: number; balance: number | null; type: string; reason: string; actor: string | null; date: Date | string; operationId: string | null };
export default async function StockMovementsPage({ searchParams }: { searchParams: Promise<{ search?: string; kind?: string; type?: string; page?: string }> }) {
  await assertAdmin();
  const filters = await searchParams; const ready = await inventorySchemaReady(); const search = (filters.search || '').trim().slice(0, 150); const kind = ['MATERIAL', 'COMPONENT', 'PRODUCT'].includes(filters.kind || '') ? filters.kind! : 'ALL'; const type = ['PRODUCTION', 'PURCHASE', 'CORRECTION', 'ORDER_RESERVATION', 'CANCELLATION', 'REOPEN', 'INSPECTED_RETURN', 'LEGACY'].includes(filters.type || '') ? filters.type! : 'ALL'; const page = Math.max(1, Math.min(10000, Number.parseInt(filters.page || '1', 10) || 1));
  const legacy = sql`SELECT s.id, m.name, 'MATERIAL' AS kind, s.quantity, NULL::integer AS balance, 'LEGACY' AS type, s.reason, COALESCE(u."firstName", u.email) AS actor, s."createdAt" AS date, NULL::text AS "operationId" FROM "StockMovement" s JOIN "Material" m ON m.id = s."materialId" LEFT JOIN "User" u ON u.id = s."actorId" ${ready ? sql`WHERE NOT EXISTS (SELECT 1 FROM "InventoryMovement" n WHERE n."legacyMovementId" = s.id)` : sql``}`;
  const movements = ready ? sql`SELECT n.id, n."subjectName" AS name, n."subjectKind" AS kind, n.quantity, n."balanceAfter" AS balance, o.type, o.reason, COALESCE(u."firstName", u.email) AS actor, n."createdAt" AS date, n."operationId" FROM "InventoryMovement" n JOIN "InventoryOperation" o ON o.id = n."operationId" LEFT JOIN "User" u ON u.id = o."actorId" UNION ALL ${legacy}` : legacy;
  const pattern = `%${search.replace(/[\\%_]/g, value => `\\${value}`)}%`;
  const where = sql`(${kind} = 'ALL' OR kind = ${kind}) AND (${type} = 'ALL' OR type = ${type}) AND (name ILIKE ${pattern} OR reason ILIKE ${pattern})`;
  const [result, total] = await Promise.all([db.execute(sql`SELECT * FROM (${movements}) ledger WHERE ${where} ORDER BY date DESC, id DESC LIMIT 25 OFFSET ${(page - 1) * 25}`), db.execute(sql`SELECT count(*)::integer AS count FROM (${movements}) ledger WHERE ${where}`)]);
  const rows = result.rows as unknown as Row[]; const count = Number(total.rows[0]?.count || 0); const pages = Math.max(1, Math.ceil(count / 25)); const url = (next: number) => `/admin/inventory/movements?${new URLSearchParams({ search, kind, type, page: String(next) })}`;
  return <div className={styles.dashboard}><header className={styles.pageHeader}><div><h1 className={styles.pageTitle}>Stock movements</h1><p>Purchases, production, corrections, and recorded order reservations. Historical balances are shown only when they were recorded at the time.</p></div><Link href="/admin/production">Record production</Link><Link href="/admin/inventory">Materials</Link></header>
    {!ready && <p role="status">Only legacy material movements are available until the inventory migration is applied.</p>}
    <MovementFilters key={`${search}:${kind}:${type}`} search={search} kind={kind} type={type} /><p>{count} matching movements</p>
    <div className={styles.tableScroller} role="region" aria-label="Stock movement history" tabIndex={0}><table className={styles.table}><thead><tr><th>Time</th><th>Item</th><th>Operation</th><th>Change</th><th>Balance after</th><th>Reason</th><th>Recorded by</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td>{new Date(row.date).toLocaleString('en-GB', { timeZone: 'Africa/Casablanca' })}</td><td>{row.name}<p>{row.kind.toLowerCase()}</p></td><td>{row.type.toLowerCase().replaceAll('_', ' ')}{row.operationId && <p title={row.operationId}>{row.operationId.slice(0, 8)}</p>}</td><td>{row.quantity > 0 ? '+' : ''}{row.quantity}</td><td>{row.balance === null ? 'Not recorded' : row.balance}</td><td>{row.reason}</td><td>{row.actor || 'Checkout / earlier record'}</td></tr>)}{!rows.length && <tr><td colSpan={7}>No movements match these filters.</td></tr>}</tbody></table></div>
    <nav aria-label="Movement pages" className={styles.filterBar}>{page > 1 && <Link href={url(page - 1)}>Previous</Link>}<span>Page {page} of {pages}</span>{page < pages && <Link href={url(page + 1)}>Next</Link>}</nav>
  </div>;
}
