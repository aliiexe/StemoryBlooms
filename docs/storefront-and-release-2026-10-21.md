# Storefront, media, and release follow-up

21 October 2026; final verification 22 October 2026. Continues the [admin operations work](admin-operations-2026-10-20.md) and [fix plan](fix-plan-2026-10-18.md). Implemented in the local checkout; not committed, deployed, or pushed.

## Customer journey

- Collection search, category, price range, availability, sorting, and pagination run in the database. Invalid filters, no matches, an empty catalog, and a service failure have distinct outcomes. The public catalog API returns 12-item pages with `X-Total-Count`, `X-Page`, and `X-Page-Size` headers.
- Product recommendations are limited in the query, and approved reviews are paginated. Public review results exclude linked customer identifiers and invalid legacy ratings. Product pages have individual metadata, canonical URLs, and safe JSON-LD for product, offer, stock, and approved rating information.
- The missing social image is replaced by a generated branded Open Graph image. Sitemap results refresh every five minutes. Private transactional/account/receipt/subscription routes remain noindex, with private token pages protected independently of crawler instructions.
- Search, bag, mobile navigation, and builder image previews use native modal focus/Escape behavior with custom styling. The mobile header fits at 360px. Shared toggles, review ratings, field labels, cart quantity actions, and pagination controls have keyboard/accessibility semantics.
- The bag displays custom recipe descriptions/card text and enforces the stock cap known when an item was selected. Checkout remains the authoritative current stock/price/benefit quote. A test bag was populated, quantity-capped, and restored to empty; no order was submitted.
- My Orders has pagination and authenticated private-receipt/tracking links. Guest and earlier orders are not claimed by matching an email. The previous misleading success page redirects through the protected receipt flow instead of asserting confirmation from a query string.
- Review and announcement forms retain inputs when a request fails. Tracking handles request failures/stale responses and distinguishes confirmation from production. It consults the carrier only for orders recorded as registered.
- Checkout links to editable ordering, privacy, delivery, return, and cash-on-delivery information. Product editors can record a preparation estimate. Unsupported hard-coded preparation/WhatsApp promises were removed from the repaired flows. Policy defaults describe current operation; the owner must review service commitments, legal identity, retention, and remedies before release.

## Admin follow-through

Store-mode changes have an explicit review step and conflict check. Settings patches merge under a transaction lock, preserving unrelated values. Carriers can be edited or disabled while preserving history; their reference cost is clearly separate from the customer's delivery-zone charge. Notification failures remain visible instead of being optimistically marked successful. Category editing uses server results instead of a stale optimistic list.

Announcement device/page targeting, custom/excluded paths, dismissal controls, pagination indicators, replacement text, and Casablanca schedule conversion are connected to the stored fields. Native switches/checkboxes retain custom styling. Concurrent announcement saves reject stale timestamps. The dismissal button is separate from a clickable announcement link. Screen-reader testing and a complete browser mutation matrix remain staging work.

The architecture documentation now describes the running Next/Drizzle services rather than the earlier Nest/Prisma sketch. The obsolete direct receipt-mail helper and live-database write-debug script were removed. Integration secrets pass through Turbo's server tasks without becoming public client variables.

## Media

The upload picker authorizes administrators, accepts still JPEG/PNG/WebP up to 8 MB and 16 megapixels, verifies actual image bytes, strips metadata, resizes within 1600×1600, and stores WebP URLs. It reports progress/failure and blocks its parent form while uploading. New embedded images are rejected by catalog/settings mutations; unchanged legacy references remain editable.

Production uploads require `BLOB_READ_WRITE_TOKEN`. Local development may write to the ignored `public/uploads` directory. Object storage was not contacted during verification. Existing database-embedded images are not automatically migrated.

The reviewed migration utility is `apps/web/scripts/migrate-embedded-images.ts`. From `apps/web`, a counts-only dry run can be invoked with:

```sh
pnpm exec tsx --env-file=.env.local scripts/migrate-embedded-images.ts
```

After confirming the target database, taking/verifying its backup, and configuring object storage, an operator may explicitly add `--apply --backup-confirmed`. The script processes images outside database transactions, conditionally updates only unchanged source records, and records successful migrations in the audit log. It reports counts without printing image contents, contact information, or tokens. Stale/failed records keep their original values. Uploads completed before an unsuccessful update can leave unused assets; retain/review them rather than automatically deleting storage objects.

Stock operations preserve the catalog's explicit availability choice. Selling the last unit relies on the count to show out of stock; manufacturing, cancellation, returns, and count corrections do not re-enable an item staff disabled. Review older zero-stock flags when replenishing historical items.

## Additional database migration

`0005_huge_golden_guardian.sql` adds nonnegative stock/money checks, positive recipe quantities, finished-movement balance checks, and missing product/component recipe foreign keys. It uses PostgreSQL `NOT VALID` so installation preserves historical violations for review while enforcing the constraints on new writes. Editing an old invalid row may require correcting its invalid values first. No historical quantities, cash events, or recipe references are invented or silently rewritten.

Apply `0002`–`0005`, their snapshots, and the journal through the backed-up staging/production migration process described in the admin notes. After verified cleanup, an operator should validate the named constraints separately. Do not drop these checks as a shortcut for ordinary stock edits. Tests simulate legacy rows only inside the isolated PGlite database.

## Verification and release boundaries

The automated suite passes all 72 scenarios, including all migrations from an empty database, commerce transactions, stock/benefit contention, rollback, courier uncertainty, remittances/refunds/returns, drafts, customer identity, content publication, consent tokens, image decoding, catalog filtering/privacy, settings concurrency, database checks, announcement targeting/time conversion, and preservation of manually disabled catalog availability during stock operations. Web type checking and the production build pass. Full lint has zero errors and 22 warnings; no rules were disabled. Full lint is now a blocking CI step. Offline migration generation reports no schema changes, and the tracked diff passes whitespace checks.

Browser checks include desktop store search/bag focus restoration and stock caps; 360px collection filters/product metadata/review controls/mobile menu; mobile settings confirmation and carrier-editor inspection; and 768px dashboard reporting. Checked pages fit their viewport without page-level horizontal overflow. Admin checks from the previous note cover production, finance, inventory, support, content, profiles, and jobs. No live order, inventory, payment, subscriber, policy, store-mode, or carrier record was changed. No mail, upload, or courier submission was sent. The temporary test cart was cleared.

Release still requires hosted staging, authenticated mutation/permission tests, separate PostgreSQL connections, screen-reader/full breakpoint coverage, verified email/storage delivery, carrier contract/reconciliation tests, historical stock/cash cleanup, business-owner policy review, backup/restore rehearsal, scheduler configuration, and deployment monitoring. This implementation does not convert legacy whole-MAD catalog/gift fields to centimes; new finance events use centimes and gift restoration remains whole MAD. Campaign authoring is not advertised or enabled. These limits remain explicit rather than being reported as a completed production rollout.

Remaining product/data work from the original plan includes saved-address management, the legacy whole-MAD currency conversion, a consolidated historical discrepancy report and reviewed corrections, and campaign authoring if the business elects to support campaigns. Measured performance budgets and a complete audit-by-audit acceptance walkthrough are also outstanding. The local implementation therefore does not close every finding in the 43-item audit.
