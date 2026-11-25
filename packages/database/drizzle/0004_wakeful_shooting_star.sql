CREATE TABLE "CommunicationToken" (
	"id" text PRIMARY KEY NOT NULL,
	"subscriberId" text NOT NULL,
	"purpose" text NOT NULL,
	"tokenHash" text NOT NULL,
	"expiresAt" timestamp (3) NOT NULL,
	"usedAt" timestamp (3),
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "CommunicationToken" ADD CONSTRAINT "CommunicationToken_subscriberId_WaitlistEntry_id_fk" FOREIGN KEY ("subscriberId") REFERENCES "public"."WaitlistEntry"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "CommunicationToken_hash_key" ON "CommunicationToken" USING btree ("tokenHash");--> statement-breakpoint
CREATE INDEX "CommunicationToken_subscriber_idx" ON "CommunicationToken" USING btree ("subscriberId");