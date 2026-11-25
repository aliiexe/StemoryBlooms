CREATE TABLE "InventoryMovement" (
	"id" text PRIMARY KEY NOT NULL,
	"operationId" text NOT NULL,
	"subjectKind" text NOT NULL,
	"subjectId" text NOT NULL,
	"subjectName" text NOT NULL,
	"quantity" integer NOT NULL,
	"balanceBefore" integer NOT NULL,
	"balanceAfter" integer NOT NULL,
	"legacyMovementId" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "InventoryOperation" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"actorId" text,
	"reason" text NOT NULL,
	"requestHash" text NOT NULL,
	"result" jsonb NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_operationId_InventoryOperation_id_fk" FOREIGN KEY ("operationId") REFERENCES "public"."InventoryOperation"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_legacyMovementId_StockMovement_id_fk" FOREIGN KEY ("legacyMovementId") REFERENCES "public"."StockMovement"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "InventoryOperation" ADD CONSTRAINT "InventoryOperation_actorId_User_id_fk" FOREIGN KEY ("actorId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "InventoryMovement_subject_idx" ON "InventoryMovement" USING btree ("subjectKind","subjectId");--> statement-breakpoint
CREATE UNIQUE INDEX "InventoryMovement_legacy_key" ON "InventoryMovement" USING btree ("legacyMovementId");--> statement-breakpoint
CREATE INDEX "InventoryOperation_createdAt_idx" ON "InventoryOperation" USING btree ("createdAt" DESC NULLS LAST);