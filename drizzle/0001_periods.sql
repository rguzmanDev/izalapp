CREATE TYPE "public"."payment_status" AS ENUM('pending', 'set_aside', 'paid');--> statement-breakpoint
CREATE TYPE "public"."period_item_kind" AS ENUM('income', 'fixed_expense', 'budget');--> statement-breakpoint
CREATE TYPE "public"."period_status" AS ENUM('open', 'closed');--> statement-breakpoint
CREATE TABLE "period_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"period_id" uuid NOT NULL,
	"kind" "period_item_kind" NOT NULL,
	"source_id" uuid,
	"name" text NOT NULL,
	"planned_cents" integer NOT NULL,
	"account_id" uuid NOT NULL,
	"due_day" smallint,
	"payment_status" "payment_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"year" smallint NOT NULL,
	"month" smallint NOT NULL,
	"half" smallint NOT NULL,
	"status" "period_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "periods_userId_year_month_half_unique" UNIQUE("user_id","year","month","half")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"period_id" uuid NOT NULL,
	"item_id" uuid,
	"account_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"occurred_on" date NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "period_items" ADD CONSTRAINT "period_items_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "period_items" ADD CONSTRAINT "period_items_period_id_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."periods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "period_items" ADD CONSTRAINT "period_items_account_id_financial_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."financial_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "periods" ADD CONSTRAINT "periods_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_period_id_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."periods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_item_id_period_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."period_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_financial_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."financial_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "period_items_period_id_index" ON "period_items" USING btree ("period_id");--> statement-breakpoint
CREATE INDEX "transactions_period_id_index" ON "transactions" USING btree ("period_id");--> statement-breakpoint
CREATE INDEX "transactions_item_id_index" ON "transactions" USING btree ("item_id");