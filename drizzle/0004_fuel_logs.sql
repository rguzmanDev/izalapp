CREATE TABLE "fuel_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"transaction_id" uuid NOT NULL,
	"odometer" integer NOT NULL,
	"gallons" numeric(7, 3) NOT NULL,
	"price_per_gallon" numeric(6, 3) NOT NULL,
	"station" text,
	"is_full_tank" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fuel_logs_transactionId_unique" UNIQUE("transaction_id")
);
--> statement-breakpoint
ALTER TABLE "budgets" ADD COLUMN "is_fuel" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "period_items" ADD COLUMN "is_fuel" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "fuel_logs" ADD CONSTRAINT "fuel_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fuel_logs" ADD CONSTRAINT "fuel_logs_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fuel_logs_user_id_index" ON "fuel_logs" USING btree ("user_id");