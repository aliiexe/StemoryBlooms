# Security, checkout, and admin repair release

18 October 2026. Implemented locally; not deployed. Read alongside the [audit](audit-2026-10-18.md) and [remaining plan](fix-plan-2026-10-18.md).

## Changes in this batch

- Each exported admin action and each async admin data page checks the database role. Clerk profile synchronization cannot promote a user or restore a revoked role. Role changes preserve a final administrator.
- Receipts require the recorded signed-in owner, an administrator, or a revocable signed guest link. Account history uses recorded ownership instead of checkout email. Public catalog responses omit internal fields and drafts. Private receipts have no-store, no-referrer, and no-index headers.
- Website and staff orders share pricing, validation, stock reservation, immutable customer details, and transaction handling. Website checkout displays a server quote and rejects a changed final total. Custom bouquets use validated component selections; the existing included wrapping/card pricing is retained.
- Stock, customer creation, benefits, order lines, history, and notification jobs commit together. Advisory locks and conditional stock/benefit updates protect retries and contention. A repeated request replays its private receipt; a changed request cannot reuse its attempt key. Checkout retains a previous attempt for explicit recovery for 24 hours.
- Public order creation checks store mode, active delivery zones, and destination matching. Checkout, quotes, tracking, contact, waitlist, and review submissions have shared database-backed limits. Contact email markup is escaped, and reviews enforce a published product and rating 1–5.
- Orders have explicit allowed transitions. Cancellation reverses stock and benefits once. Reopening rechecks stock; discounted cancelled orders require a new quote. Archiving preserves records. Payment collection is recorded separately from delivery. Reports distinguish booked sales and collected cash; a complete remittance/refund ledger remains outstanding.
- Restocking records quantity, expense, and movement in one transaction. Stock corrections reject stale counts. Supplier selection persists. Product/component metadata and count edits no longer silently manufacture units or deduct recipe ingredients. The unsafe repeatable stock backfill is disabled.
- Admin orders support contact/reference search, status/date filters, pagination, full amounts due, and accurate current status. Details include delivery, payment, recipes, messages, and history. Mobile navigation exposes every section; mobile order details, inventory metrics, and builder choices have responsive layouts.
- Gift-card creation uses the actual issued-value field and a random code; edits preserve redeemed balances. Existing benefits can be edited and disabled. Unsupported promo minimum-spend and gift-recipient fields were removed until those workflows exist.
- Order confirmation and courier-status work use a durable retry queue. Carrier calls time out and dispatch serializes against order changes. Browsing announcements no longer seeds database records.

## Configuration and rollout

Use Node 22 and `pnpm install --frozen-lockfile`. Preserve existing database, Clerk, upload, and integration configuration. Add these values to the deployment's secret store; never commit them:

| Variable | Purpose |
| --- | --- |
| `RECEIPT_SIGNING_SECRET` | A stable, random secret of at least 32 bytes. Existing code falls back to `CLERK_SECRET_KEY`; use the dedicated value before issuing new links. Changing it invalidates existing guest links. |
| `INTERNAL_JOB_SECRET` | A separate strong random secret for the notification worker. |
| `NEXT_PUBLIC_SITE_URL` | Canonical HTTPS origin used in confirmation links. |
| `RESEND_API_KEY` | Email delivery credentials. |
| `ORDER_EMAIL_FROM` | A sender on the store's verified sending domain. The development fallback is unsuitable for unrestricted production recipients. |
| `ORDER_NOTIFICATION_EMAIL` | Merchant inbox for order confirmations. |
| `INFINIDIS_ACCOUNT_EMAIL` | Existing courier account, required only for enabled carrier operations. |

Configure a scheduler to POST `/api/internal/notifications` every five minutes with `Authorization: Bearer <INTERNAL_JOB_SECRET>`. It processes at most ten eligible jobs per call; increase scheduling frequency if volume requires it. It retries after five minutes, reclaims processing jobs after ten minutes, and stops after five attempts. Settings shows queue counts. Failed jobs need operator inspection; do not blindly reset attempts. Resend requests use job-specific idempotency keys. Courier operations still depend on the provider's acknowledgment and need staging contract verification.

The per-IP limits depend on the hosting proxy replacing incoming forwarded-IP headers. Verify that behavior at deployment. Limits are stored as hashed events and expire after a day; no raw IP is retained by this feature.

1. Create an isolated staging database and non-production Clerk accounts. Use fictional contacts and test integration credentials. Do not enable a worker against copied real pending notifications.
2. Back up the target database and verify its migration journal. Apply the committed Drizzle migrations with the deployment's migration runner. `0001_order_delivery_flag.sql` adds the courier flag, missing audit columns, and supporting indexes; its schema snapshot is included. Do not use schema push as a substitute for a reviewed migration.
3. Run type checking, tests, commerce lint, migration drift check, and production build. The GitHub workflow runs these checks. Set the repository variable `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` to the staging public key for its build step; no production secrets are needed for the isolated tests.
4. Verify browser submissions in staging with LIVE, WAITLIST, and MAINTENANCE modes; verify anonymous/customer/admin permissions, competing purchases, expired quote totals, a lost response and reload, and receipt revocation. Use two real PostgreSQL connections/application instances for contention checks.
5. Verify email and courier payloads with test adapters/accounts before enabling integration delivery. Verify scheduler authentication and retry behavior. Then deploy code, migration, and secrets together.
6. Reconcile historical negative material counts and delivered-but-unpaid orders with actual records. Use explicit corrections and collection events only after physical/cash verification. No historical values were automatically changed by this implementation.

Legacy receipts without a nonce remain available to administrators. Use “Create new private receipt link” on the order to issue guest access after verifying the requester. Earlier guest orders are not automatically attached to an account by matching an email address.

## Verification and limits

Final local checks: **24 tests passed**, type checking passed, production build passed, commerce lint passed, and migration generation reports no schema changes. The full lint report has 93 errors and 78 warnings (down from the audit baseline of 116 errors and 101 warnings); that debt remains open. At 390px, the order status filter also passed a keyboard-only selection and GET-filter result check.

The automated suite applies both migrations to a fresh in-memory PostgreSQL-compatible database (PGlite). It exercises actual commerce services and transactions with fictional records, including last-unit contention, benefit limits, late-failure rollback, repeated requests, cancellation, archiving, cash collection, and restock expense failures. Permission tests inspect every exported admin action and async admin page for an initial authorization check. These structural checks complement, and do not replace, authenticated end-to-end permission tests.

Local browser checks use existing data read-only. At 390px, the repaired order detail and builder page both measure 390px document width, inventory metrics no longer overlap, and the full admin menu is reachable. No live order, stock, payment, benefit, role, or store-mode mutation was submitted. No email or carrier dispatch was sent.

An isolated hosted staging environment, multi-instance PostgreSQL checks, screen-reader testing, full route/breakpoint verification, and provider contract tests remain release gates. Repository-wide lint debt is tracked separately; commerce lint is blocking in CI, while the full lint report remains visible without weakening individual lint rules.

## Remaining work

Continue with a server-quoted assisted-order preview, persisted custom drafts, explicit production/material consumption, a unified carrier handoff/reconciliation workflow, returns/refunds and courier remittances, connected storefront content editing, waitlist lifecycle, cart/dialog accessibility, complete policy content, image/list performance, and the remaining storefront/search work. Keep historical data reconciliation separate from functional code repair.
