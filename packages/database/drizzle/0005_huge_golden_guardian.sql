-- Preserve legacy rows for explicit reconciliation while enforcing these rules on new writes.
ALTER TABLE "ProductBuilderComponent" ADD CONSTRAINT "ProductBuilderComponent_product_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE restrict ON UPDATE no action NOT VALID;--> statement-breakpoint
ALTER TABLE "ProductBuilderComponent" ADD CONSTRAINT "ProductBuilderComponent_component_fkey" FOREIGN KEY ("builderComponentId") REFERENCES "public"."BuilderComponent"("id") ON DELETE restrict ON UPDATE no action NOT VALID;--> statement-breakpoint
CREATE INDEX "ProductBuilderComponent_product_idx" ON "ProductBuilderComponent" USING btree ("productId");--> statement-breakpoint
ALTER TABLE "BuilderComponent" ADD CONSTRAINT "BuilderComponent_stock_nonnegative" CHECK ("BuilderComponent"."stock" >= 0) NOT VALID;--> statement-breakpoint
ALTER TABLE "BuilderComponent" ADD CONSTRAINT "BuilderComponent_price_nonnegative" CHECK ("BuilderComponent"."unitPrice" >= 0) NOT VALID;--> statement-breakpoint
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_amount_valid" CHECK ("Expense"."amount" >= 0 AND "Expense"."amount" < 1000000000000) NOT VALID;--> statement-breakpoint
ALTER TABLE "FinanceEntry" ADD CONSTRAINT "FinanceEntry_amount_nonnegative" CHECK ("FinanceEntry"."amountCents" >= 0) NOT VALID;--> statement-breakpoint
ALTER TABLE "GiftCard" ADD CONSTRAINT "GiftCard_balances_nonnegative" CHECK ("GiftCard"."initialBalance" >= 0 AND "GiftCard"."currentBalance" >= 0) NOT VALID;--> statement-breakpoint
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_balance_nonnegative" CHECK ("InventoryMovement"."balanceAfter" >= 0) NOT VALID;--> statement-breakpoint
ALTER TABLE "Material" ADD CONSTRAINT "Material_quantity_nonnegative" CHECK ("Material"."quantity" >= 0) NOT VALID;--> statement-breakpoint
ALTER TABLE "Material" ADD CONSTRAINT "Material_cost_valid" CHECK ("Material"."cost" IS NULL OR ("Material"."cost" >= 0 AND "Material"."cost" < 1000000000)) NOT VALID;--> statement-breakpoint
ALTER TABLE "Order" ADD CONSTRAINT "Order_money_nonnegative" CHECK ("Order"."subtotal" >= 0 AND "Order"."deliveryFee" >= 0 AND "Order"."discount" >= 0 AND "Order"."total" >= 0) NOT VALID;--> statement-breakpoint
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_valid_amounts" CHECK ("OrderItem"."quantity" > 0 AND "OrderItem"."unitPrice" >= 0 AND "OrderItem"."totalPrice" >= 0) NOT VALID;--> statement-breakpoint
ALTER TABLE "Product" ADD CONSTRAINT "Product_stock_nonnegative" CHECK ("Product"."stock" >= 0) NOT VALID;--> statement-breakpoint
ALTER TABLE "Product" ADD CONSTRAINT "Product_prices_nonnegative" CHECK ("Product"."basePrice" >= 0 AND ("Product"."salePrice" IS NULL OR "Product"."salePrice" >= 0)) NOT VALID;--> statement-breakpoint
ALTER TABLE "ProductBuilderComponent" ADD CONSTRAINT "ProductBuilderComponent_quantity_positive" CHECK ("ProductBuilderComponent"."quantity" > 0) NOT VALID;--> statement-breakpoint
ALTER TABLE "ProductMaterial" ADD CONSTRAINT "ProductMaterial_quantity_positive" CHECK ("ProductMaterial"."quantity" > 0) NOT VALID;
