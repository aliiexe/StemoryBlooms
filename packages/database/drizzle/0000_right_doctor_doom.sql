CREATE TABLE "Address" (
	"id" text PRIMARY KEY NOT NULL,
	"customerId" text NOT NULL,
	"city" text NOT NULL,
	"zone" text,
	"addressLine1" text NOT NULL,
	"addressLine2" text,
	"instructions" text,
	"isDefault" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "AdminInboxEvent" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"message" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"link" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "AdminNotification" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"isRead" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "AdminSettings" (
	"id" text PRIMARY KEY NOT NULL,
	"mode" text DEFAULT 'WAITLIST' NOT NULL,
	"config" jsonb,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "AnalyticsEvent" (
	"id" text PRIMARY KEY NOT NULL,
	"event" text NOT NULL,
	"userId" text,
	"metadata" jsonb,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Announcement" (
	"id" text PRIMARY KEY NOT NULL,
	"internalTitle" text NOT NULL,
	"message" text NOT NULL,
	"highlightedText" text,
	"ctaLabel" text,
	"linkUrl" text,
	"wholeBarClickable" boolean DEFAULT false NOT NULL,
	"openInNewTab" boolean DEFAULT false NOT NULL,
	"icon" text,
	"decorativeAsset" text,
	"templateId" text,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"startAt" timestamp (3),
	"endAt" timestamp (3),
	"noEndDate" boolean DEFAULT true NOT NULL,
	"isDismissible" boolean DEFAULT false NOT NULL,
	"dismissalDuration" text DEFAULT 'SESSION' NOT NULL,
	"dismissalVersion" text NOT NULL,
	"backgroundColor" text DEFAULT '#F6F4EC' NOT NULL,
	"textColor" text DEFAULT '#4A4A4A' NOT NULL,
	"accentColor" text DEFAULT '#D6CFE6' NOT NULL,
	"linkColor" text DEFAULT '#6F7E59' NOT NULL,
	"borderColor" text,
	"textAlignment" text DEFAULT 'CENTER' NOT NULL,
	"desktopFontSize" text DEFAULT '0.875rem' NOT NULL,
	"mobileFontSize" text DEFAULT '0.8rem' NOT NULL,
	"barHeight" text DEFAULT '40px' NOT NULL,
	"animationType" text DEFAULT 'FADE' NOT NULL,
	"showDesktop" boolean DEFAULT true NOT NULL,
	"showTablet" boolean DEFAULT true NOT NULL,
	"showMobile" boolean DEFAULT true NOT NULL,
	"targetMode" text DEFAULT 'ALL' NOT NULL,
	"includedPaths" text[],
	"excludedPaths" text[],
	"countdownEnabled" boolean DEFAULT false NOT NULL,
	"countdownTarget" timestamp (3),
	"countdownEndBehavior" text DEFAULT 'HIDE' NOT NULL,
	"countdownReplacementText" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"archivedAt" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "AnnouncementBarSettings" (
	"id" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"mode" text DEFAULT 'AUTO' NOT NULL,
	"autoPlay" boolean DEFAULT true NOT NULL,
	"loop" boolean DEFAULT true NOT NULL,
	"intervalSeconds" integer DEFAULT 5 NOT NULL,
	"transitionType" text DEFAULT 'FADE' NOT NULL,
	"transitionDurationMs" integer DEFAULT 400 NOT NULL,
	"pauseOnHover" boolean DEFAULT true NOT NULL,
	"showArrows" boolean DEFAULT true NOT NULL,
	"showIndicators" boolean DEFAULT true NOT NULL,
	"allowDismissal" boolean DEFAULT false NOT NULL,
	"defaultTheme" text DEFAULT 'DEFAULT' NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "AnnouncementTemplate" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"eventType" text NOT NULL,
	"previewColor" text DEFAULT '#F6F4EC' NOT NULL,
	"defaultConfig" jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "AuditLog" (
	"id" text PRIMARY KEY NOT NULL,
	"actorId" text,
	"action" text NOT NULL,
	"target" text NOT NULL,
	"requestId" text,
	"summary" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "BuilderComponent" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"unitPrice" integer NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"minQuantity" integer DEFAULT 0 NOT NULL,
	"maxQuantity" integer,
	"imageUrl" text,
	"isAvailable" boolean DEFAULT true NOT NULL,
	"materials" jsonb,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Cart" (
	"id" text PRIMARY KEY NOT NULL,
	"customerId" text,
	"sessionKey" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CartItem" (
	"id" text PRIMARY KEY NOT NULL,
	"cartId" text NOT NULL,
	"productId" text,
	"quantity" integer NOT NULL,
	"configuration" jsonb,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Category" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "_CategoryToProduct" (
	"A" text NOT NULL,
	"B" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ContactMessage" (
	"id" text PRIMARY KEY NOT NULL,
	"firstName" text NOT NULL,
	"lastName" text NOT NULL,
	"email" text NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'UNREAD' NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ContentBlock" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"content" jsonb NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Customer" (
	"id" text PRIMARY KEY NOT NULL,
	"firstName" text NOT NULL,
	"lastName" text NOT NULL,
	"email" text,
	"phone" text NOT NULL,
	"socialHandle" text,
	"internalNote" text,
	"riskFlag" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "DeliveryCompany" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"contact" text,
	"email" text,
	"fee" integer DEFAULT 0 NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "DeliveryHandoff" (
	"id" text PRIMARY KEY NOT NULL,
	"orderId" text NOT NULL,
	"companyId" text NOT NULL,
	"reference" text,
	"actorId" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "DeliveryZone" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"fee" integer NOT NULL,
	"deliveryTime" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "DraftOrder" (
	"id" text PRIMARY KEY NOT NULL,
	"payload" jsonb NOT NULL,
	"actorId" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Expense" (
	"id" text PRIMARY KEY NOT NULL,
	"amount" double precision NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"relatedMaterialId" text,
	"relatedOrderId" text,
	"date" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "GiftCard" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"initialBalance" integer NOT NULL,
	"currentBalance" integer NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LaunchCampaign" (
	"id" text PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'SCHEDULED' NOT NULL,
	"scheduledFor" timestamp (3),
	"sentCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Material" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"lowStockThreshold" integer,
	"cost" double precision,
	"supplierId" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "NotificationOutbox" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"recipient" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"lastAttempt" timestamp (3),
	"error" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Order" (
	"id" text PRIMARY KEY NOT NULL,
	"orderNumber" text NOT NULL,
	"idempotencyKey" text,
	"customerId" text NOT NULL,
	"status" text DEFAULT 'NEW' NOT NULL,
	"source" text DEFAULT 'WEBSITE' NOT NULL,
	"subtotal" integer NOT NULL,
	"deliveryFee" integer NOT NULL,
	"discount" integer DEFAULT 0 NOT NULL,
	"total" integer NOT NULL,
	"paymentStatus" text DEFAULT 'PENDING_COD' NOT NULL,
	"deliveryAddress" jsonb NOT NULL,
	"notes" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "OrderAdjustment" (
	"id" text PRIMARY KEY NOT NULL,
	"orderId" text NOT NULL,
	"amount" integer NOT NULL,
	"reason" text NOT NULL,
	"actorId" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "OrderItem" (
	"id" text PRIMARY KEY NOT NULL,
	"orderId" text NOT NULL,
	"productId" text,
	"productName" text NOT NULL,
	"quantity" integer NOT NULL,
	"unitPrice" integer NOT NULL,
	"totalPrice" integer NOT NULL,
	"configuration" jsonb,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "OrderStatusHistory" (
	"id" text PRIMARY KEY NOT NULL,
	"orderId" text NOT NULL,
	"status" text NOT NULL,
	"actorId" text,
	"note" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PaymentStatusHistory" (
	"id" text PRIMARY KEY NOT NULL,
	"orderId" text NOT NULL,
	"status" text NOT NULL,
	"actorId" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Permission" (
	"id" text PRIMARY KEY NOT NULL,
	"action" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "_PermissionToRole" (
	"A" text NOT NULL,
	"B" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Product" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"basePrice" integer NOT NULL,
	"salePrice" integer,
	"images" text[],
	"stock" integer DEFAULT 0 NOT NULL,
	"isSaleEnabled" boolean DEFAULT false NOT NULL,
	"isFeatured" boolean DEFAULT false NOT NULL,
	"isAvailable" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'PUBLISHED' NOT NULL,
	"processingEstimate" text,
	"isCustomBuilder" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ProductBuilderComponent" (
	"id" text PRIMARY KEY NOT NULL,
	"productId" text NOT NULL,
	"builderComponentId" text NOT NULL,
	"quantity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ProductMaterial" (
	"id" text PRIMARY KEY NOT NULL,
	"productId" text NOT NULL,
	"materialId" text NOT NULL,
	"quantity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ProductVariant" (
	"id" text PRIMARY KEY NOT NULL,
	"productId" text NOT NULL,
	"name" text NOT NULL,
	"price" integer NOT NULL,
	"sku" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PromoCode" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"type" text NOT NULL,
	"value" integer NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"usageLimit" integer,
	"usageCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Receipt" (
	"id" text PRIMARY KEY NOT NULL,
	"orderId" text NOT NULL,
	"orderNumber" text NOT NULL,
	"customerName" text,
	"phoneNumber" text,
	"address" text,
	"subtotal" integer NOT NULL,
	"deliveryFee" integer NOT NULL,
	"discount" integer DEFAULT 0 NOT NULL,
	"total" integer NOT NULL,
	"items" jsonb NOT NULL,
	"content" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Review" (
	"id" text PRIMARY KEY NOT NULL,
	"productId" text NOT NULL,
	"customerId" text,
	"authorName" text NOT NULL,
	"rating" integer NOT NULL,
	"title" text,
	"content" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Role" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "SiteSettings" (
	"id" text PRIMARY KEY NOT NULL,
	"mode" text DEFAULT 'WAITLIST' NOT NULL,
	"config" jsonb,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "SocialOrderMetadata" (
	"id" text PRIMARY KEY NOT NULL,
	"orderId" text NOT NULL,
	"handle" text NOT NULL,
	"platform" text NOT NULL,
	"reference" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "StockMovement" (
	"id" text PRIMARY KEY NOT NULL,
	"materialId" text NOT NULL,
	"quantity" integer NOT NULL,
	"reason" text NOT NULL,
	"actorId" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Supplier" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"contactName" text,
	"email" text,
	"phone" text,
	"address" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" text PRIMARY KEY NOT NULL,
	"clerkId" text NOT NULL,
	"email" text NOT NULL,
	"firstName" text,
	"lastName" text,
	"roleId" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "WaitlistEntry" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"source" text,
	"isVerified" boolean DEFAULT false NOT NULL,
	"unsubscribed" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Address" ADD CONSTRAINT "Address_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."AnnouncementTemplate"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "public"."Cart"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_CategoryToProduct" ADD CONSTRAINT "_CategoryToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Category"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_CategoryToProduct" ADD CONSTRAINT "_CategoryToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Product"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_relatedMaterialId_fkey" FOREIGN KEY ("relatedMaterialId") REFERENCES "public"."Material"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_relatedOrderId_fkey" FOREIGN KEY ("relatedOrderId") REFERENCES "public"."Order"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Material" ADD CONSTRAINT "Material_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "OrderAdjustment" ADD CONSTRAINT "OrderAdjustment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "PaymentStatusHistory" ADD CONSTRAINT "PaymentStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_PermissionToRole" ADD CONSTRAINT "_PermissionToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Permission"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_PermissionToRole" ADD CONSTRAINT "_PermissionToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Role"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ProductMaterial" ADD CONSTRAINT "ProductMaterial_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ProductMaterial" ADD CONSTRAINT "ProductMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "public"."Material"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Review" ADD CONSTRAINT "Review_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "public"."Material"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "AnnouncementTemplate_slug_key" ON "AnnouncementTemplate" USING btree ("slug" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "Cart_sessionKey_key" ON "Cart" USING btree ("sessionKey" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "Category_name_key" ON "Category" USING btree ("name" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "_CategoryToProduct_AB_unique" ON "_CategoryToProduct" USING btree ("A" text_ops,"B" text_ops);--> statement-breakpoint
CREATE INDEX "_CategoryToProduct_B_index" ON "_CategoryToProduct" USING btree ("B" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "ContentBlock_key_key" ON "ContentBlock" USING btree ("key" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer" USING btree ("email" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer" USING btree ("phone" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "DeliveryHandoff_orderId_key" ON "DeliveryHandoff" USING btree ("orderId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "DeliveryZone_name_key" ON "DeliveryZone" USING btree ("name" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "GiftCard_code_key" ON "GiftCard" USING btree ("code" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order" USING btree ("idempotencyKey" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order" USING btree ("orderNumber" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "Permission_action_key" ON "Permission" USING btree ("action" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "_PermissionToRole_AB_unique" ON "_PermissionToRole" USING btree ("A" text_ops,"B" text_ops);--> statement-breakpoint
CREATE INDEX "_PermissionToRole_B_index" ON "_PermissionToRole" USING btree ("B" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode" USING btree ("code" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "Role_name_key" ON "Role" USING btree ("name" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "SocialOrderMetadata_orderId_key" ON "SocialOrderMetadata" USING btree ("orderId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "User_clerkId_key" ON "User" USING btree ("clerkId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "User_email_key" ON "User" USING btree ("email" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "WaitlistEntry_email_key" ON "WaitlistEntry" USING btree ("email" text_ops);