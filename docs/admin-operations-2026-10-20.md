# Admin operations follow-up

Implemented locally on 20 October 2026. This continues the [fix plan](fix-plan-2026-10-18.md) after the security/checkout commit `33a1f7b` and assisted-order/draft commit `fe78eb2`. This batch has not been deployed or applied to the business database.

## Implemented workflows

| Area | Result |
| --- | --- |
| Production | Preview a component's raw-material recipe or a product's finished-component/direct-material recipe. Record a completed batch atomically. Ingredient shortages, changed recipes, historical negative output balances, and duplicate submissions cannot silently consume stock. Assembly does not consume a component's raw recipe a second time. |
| Stock | Separate purchases, count corrections, production, reservations, cancellations, reopening, and inspected returns. Group immutable movements by operation, actor, and reason. Keep earlier material history without duplicate rows or invented historical balances. |
| Materials | Search and filter stock, suppliers, low quantities, and balances needing recount. Purchases include reviewed unit cost and an expense in the same transaction. Metadata editing cannot change an existing count. Remove only zero-count materials without recipes, expenses, or stock history. |
| Catalog | Product/component stock changes use the stock workflow. Product archival and component disabling preserve their recipes and history. Recipe input rejects malformed rows and missing ingredients. |
| Delivery | Choose an active carrier, queue registration, and distinguish acknowledgment from physical parcel handoff. A reference is required to record handoff and mark shipped. Explicit rejection, uncertain acknowledgment, queued cancellation, and dashboard reconciliation are separate states. Uncertain submissions are never automatically resent. |
| Finance | Record who collected an order's cash, net carrier remittances, withheld fees, cash refunds, and restored gift balance. The shared summary appears in Dashboard, Reports, and Finance. Cash held by carriers is separate from owner cash. Historical paid records without a collection-source event remain unclassified. |
| Returns | Record received quantities and inspection results. Only reusable units return to finished stock. Damaged units consume the return allowance without adding stock. Inspection never initiates a refund; recording a cash refund never transfers money or restocks goods. |
| Expenses | Validate amount/date/category, protect linked purchase/order expenses, reject stale edits, safely replay creation, and void erroneous manual entries with a reason and retained original audit record. |
| Customers | Search paginated profiles, keep staff-only notes/review flags, edit contacts with conflict and duplicate checks, and browse paginated order history. Profile changes preserve existing order snapshots and snapshot earlier legacy order contacts. They grant no account ownership. |
| Website content | Edit the actual homepage hero and shipping/returns/FAQ copy. Save a private draft, preview the text, and explicitly publish a revision. Concurrent edits cannot overwrite one another. Text renders as React text; CTA destinations are restricted to local paths. Unsupported generic editors no longer imply they affect public pages. |
| Support | Search and paginate full messages/reviews. Read, resolve, and reopen messages; approve, reject, or reconsider reviews without deleting their original content. Changes require the status seen by the editor and record the acting administrator. Email links open the staff member's mail app; the admin does not send support replies. |
| Notification jobs | Search status/type/order reference and inspect delivery attempts without exposing raw job payloads or token links. Retry only failed order-confirmation/status jobs with a verification note. Shipment registration is reconciled through Deliveries. A partial email retry skips recipients already acknowledged. |
| Waitlist | Distinguish verified, awaiting verification, and unsubscribed addresses. Public signup queues a confirmation message; hashed, expiring, one-use tokens support explicit confirmation and unsubscribe. Opening a GET link makes no consent change. Subscription pages remain reachable during maintenance/waitlist mode. No campaign sender or scheduler is advertised by this screen. |
| Privacy/reporting | Analytics drops private admin/account/receipt/checkout/subscription routes and strips public query strings/fragments. Subscription pages have no-store/no-referrer/noindex headers. Booked merchandise adds gift tender back rather than treating it as a promotional reduction. Business-day reporting uses Africa/Casablanca. |

New actions and data pages independently require an administrator. Mutation checks run in the service transaction, rather than relying on whether a button is disabled.

## Database rollout

Three additive migrations were generated offline and tested on a fresh isolated database:

1. `0002_square_carlie_cooper.sql`: `InventoryOperation` and `InventoryMovement`.
2. `0003_white_mastermind.sql`: `FinanceEntry` and `OrderReturn`.
3. `0004_wakeful_shooting_star.sql`: `CommunicationToken`.

Retain each SQL file, its snapshot, and the updated Drizzle journal together. The earlier `0000` baseline and `0001` fixes remain prerequisites. Follow the existing [migration and backup rollout](security-checkout-release.md#configuration-and-rollout): confirm the target's actual migration history before running its reviewed migration runner. Do not replay the baseline against an already populated schema and do not substitute schema push for migration review.

These migrations create no historical cash, production, consent, or stock events. New stock and finance controls display a migration notice while their tables are absent. Existing checkout remains compatible with that transitional state, so deploy the migrations before reopening writes to capture the complete new stock history. Waitlist signup reports temporarily unavailable if confirmation storage is missing instead of claiming a subscription succeeded.

No migration was applied to the connected business database. Preserve a database backup and perform staging migration/rollback rehearsal before production rollout. Retain the new ledger tables if code is rolled back; do not discard newly recorded business history.

## Worker and integration operation

Use the existing secured POST `/api/internal/notifications` scheduler and secret configuration described in the security release. Generic notification jobs have bounded retries; the new dispatch type is claimed once and requires manual reconciliation after an uncertain result or interruption. Registration never marks an order shipped. An explicit admin retry targets its selected job, without processing unrelated orders.

Configure a verified sender, canonical HTTPS `NEXT_PUBLIC_SITE_URL`, merchant inbox, Resend credentials, and carrier account through the deployment's secret store. The development sender fallback is not a production sending identity. The 24-hour verification token is stored as a hash in `CommunicationToken`; the queued verification message necessarily retains its secret links in the protected outbox. Do not export raw notification payloads into client data, logs, analytics, or support reports. Unsubscribe links expire after one year; rejoining requires a fresh confirmation.

Carrier submission retains the project's existing endpoint/payload and strictly classifies acknowledgment, rejection, and uncertainty. A public search of the [provider's site](https://infinidis.ma/) did not locate an API contract. Endpoint behavior, field meanings, acknowledgment shape, authenticated tracking, and status mapping still require provider documentation and an authorized test account. No real registration, courier status change, email, or campaign was sent during this work. Automatic carrier-to-store polling/webhook reconciliation remains outstanding; staff can record a verified result and physical handoff now.

## Verification

- **62 automated tests pass** against isolated PGlite instances initialized from every committed migration in the journal. Tests exercise actual commerce services, not a live database.
- Cases include production contention/recipe changes, double-consumption prevention, movement rollback, purchases/costs, order reservations/releases, uncertain carrier dispatch, handoff idempotence, collection/remittance/fee reconciliation, partial refund caps, gift-credit replay and rollback, inspected reusable/damaged returns, contact preservation/conflicts, private content drafts, moderation conflicts, per-recipient email retry, waitlist token handling, private analytics filtering, and Casablanca business days.
- Type checking and the expanded blocking CI lint scope pass. Repository-wide lint remains separate debt: the latest full report has **69 errors and 41 warnings**, reduced from 89/71 after the draft batch. No global lint rules were disabled.
- Offline migration generation reports no schema drift.
- Browser checks used the existing database read-only: desktop production preview/shortages and movement fallback; 390px content preview, inventory, delivery filtering/cards, and customer profile; 360px finance, expense dialog, notification jobs, waitlist, and review queues. Checked mobile documents measured their viewport width without page-level horizontal overflow. Expense-dialog Escape dismissal restored focus to its trigger. No business mutation was submitted.
- Full staging browser mutations, all supported breakpoints, screen-reader checks, separate PostgreSQL connections/instances, verified email delivery, carrier contract tests, and deployment monitoring remain release gates. PGlite contention checks do not replace hosted multi-connection tests.

## Remaining plan scope

This batch advances phases 2–4 and part of phase 5; it does not complete the entire audit. Remaining work includes storefront discovery/search/filtering, wider builder/cart/accessibility polish, account/address workflows, media storage and image performance, metadata/sitemaps, complete owner-reviewed policy copy, campaign authoring/delivery if required, full currency migration from legacy whole-MAD fields, repository lint debt, integration reconciliation, hosted staging, historical stock/cash cleanup, and deployment. Gift restoration still uses whole MAD because the existing gift-card balance is integer MAD; new finance entries use integer centimes.

Historical negative stock requires a physical count and a reasoned correction. Delivered or paid labels alone do not prove cash was collected or remitted. Record those facts only after checking the actual business records.


The [21 October storefront/media follow-up](storefront-and-release-2026-10-21.md) implements the customer discovery, account links, policy routes, media upload path, metadata, settings/announcement repairs, and additional database checks described as remaining above. It also brings full web lint to zero errors. Its release boundaries supersede the corresponding backlog descriptions; production data cleanup and deployment are still pending.


## November experience and payment refresh

The November refresh replaces the admin shell, dashboard, order and draft lists, product library, assisted-order form, city-price directory, and builder management. The actual floral logo is used in expanded, collapsed, and mobile navigation. Lists use one visual system, compact rows, search, clear views, and order details for fulfillment and payment actions. Mobile order rows become cards while preserving the table’s information and links.

An assisted order can have an independently selected source and fulfillment method. Pickup has no courier or delivery fee. Staff can preserve a catalog product or custom recipe while setting a negotiated line price with a reason. Card, cash, and bank receipts can cover all of an order, items only, delivery only, or a partial amount. Amounts are recorded in centimes; no card is charged. Received payments, allocation, actor, and retry identity are saved transactionally, with an optional finance-ledger mirror. Receipts, email summaries, admin lists, deliveries, and customer order history use the resulting remaining balance. Payments cannot overpay, race a stale form, or be counted twice. A payment after courier registration requires a verified carrier-balance check before handoff.

New assisted orders default to no inventory reservation. Settings → How you manage availability adds an explicit choice between manual online availability and stock limits. The existing online default is preserved until the owner changes it. Manual mode respects published/available choices and recipe selection limits, without requiring historical purchases or deducting/restoring counts. Product recipes are optional, and editing product metadata does not overwrite stock that changed while the form was open. No historical purchases, payments, or stock corrections are fabricated.

The storefront refresh includes a product-led homepage, quieter navigation with a larger real logo, compact collection filters, product cards, both bouquet builder steps and review, pickup checkout, a shared consent control with separate policy links, private receipt payment balances, and clearer loading/error recovery. Public tracking projects only fulfillment metadata and status; pickup does not show courier steps. Existing site copy and business history remain available.

Design references were [Shopify draft orders](https://help.shopify.com/en/manual/fulfillment/managing-orders/create-orders/create-draft), [Shopify partial payments](https://help.shopify.com/en/manual/payments/partial-payments), [Stripe payment records](https://support.stripe.com/questions/view-payment-records-in-the-dashboard?locale=en-GB), and [Aesop gifting](https://www.aesop.com/gifts/). Their workflow clarity and restrained presentation informed the changes; no third-party assets or branding were copied.

The isolated suite now passes 89 tests, including split card/items versus cash/delivery, pickup, price overrides, payment replay/concurrency, finance-table transition, manual stock modes, reporting periods with zero-order days, and nested modal scroll restoration. Production builds and web type checking pass; full lint has no errors, with existing image and unused-code warnings. Signed-in local browser checks covered the dashboard, drafts, actual order and product rows, order details, assisted-order form, builder management, instant city search, storefront, and customer builder selection/review. The assisted form, mobile drawer, and mobile order list were checked at 390px with no page-level horizontal overflow. A customer-free screenshot is retained in preview/admin-collection-refresh.jpg.

No business order, payment, stock, city rate, store mode, carrier record, or email was created or changed by these checks. All test mutations used isolated PGlite databases. Production deployment, optional migrations, hosted multi-connection testing, carrier contract checks (including revised COD decimals), real email delivery, full keyboard/screen-reader testing, and any owner-led reconciliation remain outstanding. Historical missing payments are not evidence of unpaid customers and should be reviewed against actual receipts before collection.


### Website management and layout follow-up — 25 November

Website content now has a page picker, bounded fields, a draft preview, and separate save/publish controls. Unsaved edits survive switching between pages. Homepage tagline edits are connected to the actual hero. Discounts and gift cards have searchable tables and focused editing dialogs; exhausted codes are labeled accurately. Announcement templates fill the submitted values as well as the preview. Optional appearance, scheduling, and countdown settings are folded away. Settings are divided into selling/availability, bouquet pricing, website images, delivery carriers, and notifications. Categories, messages, reviews, subscribers, notification jobs, and staff access use the shared workspace presentation.

Shared dialogs are centered at desktop and phone sizes. Nested dialogs retain the page scroll lock until all are closed. Select menus stay inside the available dialog space; Escape closes the menu before the enclosing dialog. The local development indicator is hidden because it overlapped the collapsed sidebar control. Client save handlers preserve uncontrolled fields when an action rejects the save, including contact, category, promotion, gift-card, expense, carrier, material, supplier, and customer forms. The public contact form uses the same custom subject selector and preserves a rejected message.

Order details separate payment, customer/fulfillment, items/totals, and a collapsed styled history. Historical completed orders with no receipt entry say **No payment recorded**, rather than asserting the customer did not pay. Legacy pickup-looking addresses stored as courier orders are flagged for review without changing fulfillment or delivery fees.

Finance defaults to this month, with all recorded history available through the period selector. Receipts and expenses follow the selected period; unsettled carrier balances remain visible across all dates. Missing historical receipts are explained without inventing cash. Reports show every day in the selected period, including zero-order days, and distinguish booked order value from received money.

Final verification: production build and web type checking passed. Full web lint reports **0 errors and 24 warnings**. The **89 isolated tests pass**. Browser checks covered all Website & settings routes, category/offer/expense dialogs, announcement authoring, the content publish confirmation (cancelled), sidebar pointer and keyboard behavior, aligned builder controls, and the public contact form. At 390px, content, finance, city lookup, and contact had no page-level horizontal overflow. The expense menu remained within the dialog. Escape closed a select first and its parent dialog on the next press. Desktop and phone publishing confirmations were centered. The temporary viewport override was reset, and only the review tab was closed. No saves, publications, access changes, payments, messages, orders, or inventory changes were submitted to the business database. A current screenshot is retained at `preview/content-editor-refresh.jpg`.
