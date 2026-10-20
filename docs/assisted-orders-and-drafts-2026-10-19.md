# Assisted orders and custom-order drafts

Implemented locally on 19 October 2026. This follow-up addresses the assisted-order preview and draft workflow in phases 2 and 3 of the [fix plan](fix-plan-2026-10-18.md), including audit finding F28.

## Staff workflow

1. Open **New Assisted Order**. Choose a channel, buyer, delivery city or in-person hand delivery, and items. Add a separate recipient when a gift goes to someone other than the buyer.
2. Catalog items display current price and stock. A **Custom bouquet** has its own component recipe, quantity, and card message; multiple bouquets can have different recipes. A **Manual item** is explicitly priced by staff and does not reserve catalog or component stock.
3. The summary requests a server quote. It includes current sale pricing, the configured bouquet base fee, included wrapping/card, active promotion, manual discount, delivery, and the full amount to collect. Manual discounts require a reason. An invalid selection or failed quote keeps order creation unavailable.
4. **Save draft** accepts incomplete work and gives it a durable URL. Saved drafts are shared between authorized administrators. Saving a draft does not create a customer, reserve stock, redeem a promotion, queue a confirmation, or count as a sale.
5. Open **Order Drafts** to search by title, buyer, phone, draft ID, or converted order reference. Filter active, archived, converted, or all records; results are paginated. Resume a draft, archive it without deleting data, or restore archived work.
6. **Review and create order** checks required contact and delivery fields, shows a confirmation, saves the draft, and converts it through the shared order service. The resulting order opens in the admin workspace. Its private receipt also shows a separate recipient when one was entered.

Earlier form-shaped database drafts can be resumed. The editor also offers explicit recovery of the previous browser-only assisted form. Once recovered work is saved to the server, the old browser copy is removed. Unrecognized older payloads remain intact and display a review notice instead of being overwritten.

## Reliability and access

- Every new action and data page independently requires an administrator. Draft history records the actual administrator and operation in the audit log.
- Draft revisions are checked under a database lock. A conflicting edit asks staff to reload the saved version while retaining the editor's current fields. Repeating an acknowledged or interrupted save with identical content does not add another revision.
- Conversion checks the current revision, stock, price, benefits, and delivery eligibility. It compares a quote fingerprint as well as the final amount, so offsetting price changes cannot hide a changed quote.
- The new order, stock and benefit deductions, customer snapshot, history, notification job, and draft's converted state commit in one transaction. A failure in the final draft write rolls everything back.
- Concurrent or repeated conversion opens the same linked order, including when stock is exhausted afterward. A converted draft cannot create another order or be edited back into an active draft.
- Buyer and recipient snapshots are separate. Carrier submission uses the recipient's name and phone when supplied. Manual discount amounts and reasons remain visible in admin detail and creation history.
- Confirmation dialogs now use a styled native modal: initial focus goes to cancellation, focus stays inside, Escape dismisses it, and focus returns to the opening control.

The existing `DraftOrder.payload` JSON field stores a validated, versioned envelope. **No new database migration is required for this follow-up**; the previous security release's migration remains a prerequisite. Quotes do not reserve stock, so a draft can legitimately lose availability before conversion. Staff must refresh or replace unavailable selections.

## Verification

- **36 automated tests pass**, including real service calls against an isolated PGlite database initialized from the committed migrations. New scenarios cover server pricing and promotion totals, same-total price changes, multiple recipes, recipient validation, incomplete draft saves, stale edits, concurrent conversion, late-failure rollback, stock loss after quoting, archive/restore, and legacy payload retention.
- Type checking, production build, and focused commerce/admin lint pass. CI now blocks on lint for the assisted editor, draft actions/pages, and shared confirmation dialog.
- Authenticated browser checks confirmed searchable item/component/city controls, unavailable selections, a real server quote, local review without creation, modal focus/Escape/return behavior, and draft status filtering.
- At both 360px and 390px, the editor has no page overflow or clipped form controls. An intrinsic grid-width issue found during verification was repaired in the editor and shared custom select.
- Full repository lint still reports **89 errors and 71 warnings**, down from 93 errors and 78 warnings before this follow-up; that remaining debt is outside these focused checks.

Browser verification did not save or convert any live draft, place an order, change stock, redeem benefits, or send email/courier work. Hosted staging verification of the complete browser save/resume/convert flow and concurrent connections remains a release gate. The test database was isolated from existing business data.

## Remaining admin work

Continue with explicit production/material consumption, carrier handoff and exception handling, refunds and courier remittances, connected storefront content editing, support/customer workflow completion, and the remaining search, filters, performance, and accessibility work in the original plan. The shared modal and select fixes improve existing screens, but do not establish a complete accessibility pass for the admin.
