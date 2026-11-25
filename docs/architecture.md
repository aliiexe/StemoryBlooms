# Stemory Blooms architecture

Updated 21 October 2026. This describes the running application; earlier PRD sketches are not deployment instructions.

## Runtime

`apps/web` runs Next.js 16.2 App Router with React, TypeScript, Clerk, and Drizzle. The storefront, admin workspace, server actions, and HTTP routes execute here. `apps/api` contains the earlier Nest/Fastify scaffold and is not the active checkout/admin API. Do not deploy it as a second source of business rules.

`packages/database/schema.ts` is the authoritative PostgreSQL schema. `packages/database/drizzle` contains ordered SQL migrations, snapshots, and the journal. The Prisma files are legacy; avoid generating a separate schema or using Prisma push against the running database. Apply reviewed migrations through the deployment runner after backup and staging rehearsal. Schema generation is offline; it does not apply a migration.

`packages/contracts` defines Zod request shapes. `packages/ui` supplies shared store components and the browser cart. `packages/security` supplies role-name types/constants; actual permission enforcement is in `apps/web/lib/user-sync.ts`. The database role is authoritative, and every sensitive action/data page must enforce access independently. Clerk profile synchronization cannot promote a user.

## Business services

`apps/web/lib/commerce` implements pricing, atomic order creation and stock reservation, immutable order contact/product snapshots, private receipts, draft conversion, order transitions, stock movements and production, delivery registration/handoff reconciliation, payment/remittance/refund/inspection records, customer edits, support moderation, notification jobs, waitlist consent, and bounded public catalog queries. Actions validate inputs and call these services. New mutations keep their business changes and audit/history records together in a transaction.

External email and carrier calls run outside order transactions through the durable notification outbox. `POST /api/internal/notifications` requires a secret bearer token and an external scheduler. Acknowledged carrier registration is distinct from physical handoff and collected cash. Uncertain registrations require a staff dashboard check; they are not automatically resent. A timeout must not create a duplicate order or shipment.

Public checkout snapshots recorded account ownership rather than claiming orders by a supplied email address. Guest receipts require signed, revocable links. Admin, account, checkout, tracking, receipt, and subscription pages are excluded from indexing; private token routes have no-referrer/no-store handling. Analytics omits private routes and strips public query strings.

## Content and media

Versioned supported page copy uses `ContentBlock`: drafts remain private until explicit publication. Announcements retain separate scheduling and targeting. Schedules are entered in Africa/Casablanca time and stored as instants. Policy text must be reviewed by the business owner before release.

New admin image uploads are authorized, decoded/validated, stripped of metadata, resized, converted to WebP, and saved to Vercel Blob. Production requires `BLOB_READ_WRITE_TOKEN`; development can use local `public/uploads`. Database fields retain references. Legacy embedded images remain readable until a backed-up migration is explicitly applied; the migration script defaults to a counts-only dry run and rejects stale record writes.

## Setup and release

Use Node 22 and pnpm 9. Install with `pnpm install --frozen-lockfile`. Configure the database, Clerk publishable/secret/webhook values, and canonical HTTPS site origin in the deployment secret/configuration store. The precise mail, storage, receipt, worker, and carrier values are listed in [the security release runbook](security-checkout-release.md#configuration-and-rollout). Turbo passes integration secrets to server tasks and keys build output on `NEXT_PUBLIC_SITE_URL`.

Provision a staging database and normal test customer/admin sign-ins. Establish the first administrator using the reviewed database administration procedure; never derive admin privileges from public profile metadata. Use fictional orders and integration adapters/test accounts. A copied pending outbox must not send to real recipients.

Run web type checking, lint, tests, offline migration drift generation, and production build. Tests initialize an isolated PostgreSQL-compatible PGlite database from every migration. Hosted multi-connection concurrency tests, authenticated browser mutations, screen-reader/breakpoint coverage, provider contract testing, backup/restore rehearsal, and monitoring remain deployment gates.

Follow [admin operations rollout](admin-operations-2026-10-20.md) and [storefront/media follow-up](storefront-and-release-2026-10-21.md). Historical stock, cash, carrier settlements, and subscriber consent require verified reconciliation; code repair must not fabricate those events.
