CREATE TABLE "datasets" (
	"name" text PRIMARY KEY NOT NULL,
	"title" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "datasets" ("name")
SELECT DISTINCT "dataset" FROM "documents" WHERE "dataset" IS NOT NULL
UNION
SELECT DISTINCT "dataset" FROM "schemas" WHERE "dataset" IS NOT NULL
ON CONFLICT ("name") DO NOTHING;
--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_dataset_datasets_name_fk" FOREIGN KEY ("dataset") REFERENCES "public".datasets("name") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schemas" ADD CONSTRAINT "schemas_dataset_datasets_name_fk" FOREIGN KEY ("dataset") REFERENCES "public".datasets("name") ON DELETE no action ON UPDATE no action;
