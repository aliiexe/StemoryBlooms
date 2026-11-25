CREATE TABLE "FinanceEntry" (
	"id" text PRIMARY KEY NOT NULL,
	"orderId" text NOT NULL,
	"type" text NOT NULL,
	"channel" text NOT NULL,
	"amountCents" integer NOT NULL,
	"reason" text NOT NULL,
	"reference" text,
	"actorId" text,
	"requestHash" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "OrderReturn" (
	"id" text PRIMARY KEY NOT NULL,
	"orderId" text NOT NULL,
	"actorId" text,
	"reason" text NOT NULL,
	"items" jsonb NOT NULL,
	"requestHash" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "FinanceEntry" ADD CONSTRAINT "FinanceEntry_orderId_Order_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "FinanceEntry" ADD CONSTRAINT "FinanceEntry_actorId_User_id_fk" FOREIGN KEY ("actorId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "OrderReturn" ADD CONSTRAINT "OrderReturn_orderId_Order_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "OrderReturn" ADD CONSTRAINT "OrderReturn_actorId_User_id_fk" FOREIGN KEY ("actorId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "FinanceEntry_order_idx" ON "FinanceEntry" USING btree ("orderId");--> statement-breakpoint
CREATE INDEX "FinanceEntry_createdAt_idx" ON "FinanceEntry" USING btree ("createdAt" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "OrderReturn_order_idx" ON "OrderReturn" USING btree ("orderId");