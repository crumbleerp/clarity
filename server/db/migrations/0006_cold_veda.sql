CREATE TYPE "public"."document_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "status" "document_status" DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "is_revision" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "revision_of" text;--> statement-breakpoint
CREATE INDEX "documents_status_idx" ON "documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "documents_deleted_at_idx" ON "documents" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "documents_revision_idx" ON "documents" USING btree ("is_revision");