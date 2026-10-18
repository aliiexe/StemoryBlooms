ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "sentToInfinidis" boolean NOT NULL DEFAULT false;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Order_createdAt_idx" ON "Order" ("createdAt" DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Order_status_idx" ON "Order" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "NotificationOutbox_status_idx" ON "NotificationOutbox" ("status", "createdAt");

--> statement-breakpoint
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "details" jsonb;
--> statement-breakpoint
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "ipAddress" text;
--> statement-breakpoint
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "userAgent" text;
