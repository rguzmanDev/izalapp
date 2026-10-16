-- Credit cards become an informative tag; bank/cash accounts hold the money.

ALTER TABLE "transactions" ADD COLUMN "credit_card_id" uuid;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_credit_card_id_financial_accounts_id_fk"
  FOREIGN KEY ("credit_card_id") REFERENCES "public"."financial_accounts"("id") ON DELETE SET NULL;

CREATE TABLE "card_payments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "card_id" uuid NOT NULL,
  "amount_cents" integer NOT NULL,
  "occurred_on" date NOT NULL,
  "note" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE "card_payments" ADD CONSTRAINT "card_payments_user_id_user_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE;
ALTER TABLE "card_payments" ADD CONSTRAINT "card_payments_card_id_financial_accounts_id_fk"
  FOREIGN KEY ("card_id") REFERENCES "public"."financial_accounts"("id") ON DELETE CASCADE;
CREATE INDEX "card_payments_card_id_index" ON "card_payments" ("card_id");
CREATE INDEX "card_payments_user_id_index" ON "card_payments" ("user_id");

-- Move expenses charged to a credit card onto its funding bank account; keep the card as a tag.
UPDATE "transactions" AS t
SET
  "credit_card_id" = t."account_id",
  "account_id" = COALESCE(card."payment_account_id", t."account_id")
FROM "financial_accounts" AS card
WHERE card."id" = t."account_id"
  AND card."type" = 'credit'
  AND card."payment_account_id" IS NOT NULL;

-- Period items that pointed at a card now point at the funding bank.
UPDATE "period_items" AS pi
SET "account_id" = card."payment_account_id"
FROM "financial_accounts" AS card
WHERE card."id" = pi."account_id"
  AND card."type" = 'credit'
  AND card."payment_account_id" IS NOT NULL;

-- Budget templates: spending account becomes the funding bank.
UPDATE "budgets" AS b
SET "spending_account_id" = card."payment_account_id"
FROM "financial_accounts" AS card
WHERE card."id" = b."spending_account_id"
  AND card."type" = 'credit'
  AND card."payment_account_id" IS NOT NULL;

-- Fixed expense templates paid from a card → funding bank.
UPDATE "fixed_expenses" AS fe
SET "payment_account_id" = card."payment_account_id"
FROM "financial_accounts" AS card
WHERE card."id" = fe."payment_account_id"
  AND card."type" = 'credit'
  AND card."payment_account_id" IS NOT NULL;

-- Old card payments (transfers into a credit account) become informative card_payments.
INSERT INTO "card_payments" ("user_id", "card_id", "amount_cents", "occurred_on", "note", "created_at", "updated_at")
SELECT
  tr."user_id",
  tr."to_account_id",
  tr."amount_cents",
  tr."occurred_on",
  COALESCE(tr."note", 'Pago de tarjeta (migrado)'),
  tr."created_at",
  tr."updated_at"
FROM "transfers" AS tr
INNER JOIN "financial_accounts" AS card ON card."id" = tr."to_account_id"
WHERE card."type" = 'credit';

DELETE FROM "transfers" AS tr
USING "financial_accounts" AS card
WHERE card."id" = tr."to_account_id"
  AND card."type" = 'credit';
