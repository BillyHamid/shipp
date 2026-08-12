-- CreateEnum
CREATE TYPE "ParcelState" AS ENUM ('registered', 'received_warehouse', 'preparing', 'shipped', 'in_transit', 'arrived_country', 'customs', 'out_for_delivery', 'delivered', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentState" AS ENUM ('pending', 'paid', 'refunded', 'waived');

-- CreateEnum
CREATE TYPE "BoxStatus" AS ENUM ('open', 'shipped', 'in_transit', 'arrived', 'closed');

-- CreateEnum
CREATE TYPE "BoxType" AS ENUM ('CARGO', 'EXPRESS');

-- CreateEnum
CREATE TYPE "CashOpType" AS ENUM ('inflow', 'outflow', 'transfer');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'XOF', 'EUR');

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "permissions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "country" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "user_agent" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "country" TEXT NOT NULL,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boxes" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "type" "BoxType" NOT NULL,
    "capacity_kg" DECIMAL(10,2) NOT NULL,
    "origin_country" TEXT NOT NULL,
    "dest_country" TEXT NOT NULL,
    "status" "BoxStatus" NOT NULL DEFAULT 'open',
    "departed_at" TIMESTAMP(3),
    "arrived_at" TIMESTAMP(3),
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcels" (
    "id" TEXT NOT NULL,
    "tracking_number" TEXT NOT NULL,
    "qr_signature" TEXT NOT NULL,
    "box_id" TEXT,
    "sender_id" TEXT NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "weight_kg" DECIMAL(10,3) NOT NULL,
    "declared_value" DECIMAL(12,2),
    "origin_country" TEXT NOT NULL,
    "dest_country" TEXT NOT NULL,
    "price_usd" DECIMAL(12,2) NOT NULL,
    "price_xof" DECIMAL(14,2) NOT NULL,
    "exchange_rate" DECIMAL(10,4) NOT NULL,
    "current_state" "ParcelState" NOT NULL DEFAULT 'registered',
    "payment_state" "PaymentState" NOT NULL DEFAULT 'pending',
    "estimated_delivery" TIMESTAMP(3),
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parcels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcel_events" (
    "id" TEXT NOT NULL,
    "parcel_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "from_state" "ParcelState",
    "to_state" "ParcelState",
    "actor_id" TEXT NOT NULL,
    "scanned" BOOLEAN NOT NULL DEFAULT false,
    "geo_location" JSONB,
    "metadata" JSONB,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parcel_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "parcel_id" TEXT NOT NULL,
    "amount_usd" DECIMAL(12,2) NOT NULL,
    "amount_xof" DECIMAL(14,2) NOT NULL,
    "mode" TEXT NOT NULL,
    "status" "PaymentState" NOT NULL DEFAULT 'pending',
    "paid_at" TIMESTAMP(3),
    "cash_account_id" TEXT,
    "recorded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_accounts" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "currency" "Currency" NOT NULL,
    "balance" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_operations" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "type" "CashOpType" NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "balance_before" DECIMAL(16,2) NOT NULL,
    "balance_after" DECIMAL(16,2) NOT NULL,
    "reference_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_rules" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "origin_country" TEXT NOT NULL,
    "dest_country" TEXT NOT NULL,
    "base_price_usd" DECIMAL(10,2) NOT NULL,
    "per_kg_usd" DECIMAL(10,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "valid_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" TEXT NOT NULL,
    "from_currency" "Currency" NOT NULL,
    "to_currency" "Currency" NOT NULL,
    "rate" DECIMAL(14,6) NOT NULL,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT,
    "diff" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_active_idx" ON "users"("active");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "customers_phone_idx" ON "customers"("phone");

-- CreateIndex
CREATE INDEX "customers_country_idx" ON "customers"("country");

-- CreateIndex
CREATE UNIQUE INDEX "boxes_reference_key" ON "boxes"("reference");

-- CreateIndex
CREATE INDEX "boxes_status_idx" ON "boxes"("status");

-- CreateIndex
CREATE INDEX "boxes_origin_country_dest_country_idx" ON "boxes"("origin_country", "dest_country");

-- CreateIndex
CREATE UNIQUE INDEX "parcels_tracking_number_key" ON "parcels"("tracking_number");

-- CreateIndex
CREATE INDEX "parcels_tracking_number_idx" ON "parcels"("tracking_number");

-- CreateIndex
CREATE INDEX "parcels_current_state_idx" ON "parcels"("current_state");

-- CreateIndex
CREATE INDEX "parcels_payment_state_idx" ON "parcels"("payment_state");

-- CreateIndex
CREATE INDEX "parcels_sender_id_idx" ON "parcels"("sender_id");

-- CreateIndex
CREATE INDEX "parcels_recipient_id_idx" ON "parcels"("recipient_id");

-- CreateIndex
CREATE INDEX "parcels_box_id_idx" ON "parcels"("box_id");

-- CreateIndex
CREATE INDEX "parcels_created_at_idx" ON "parcels"("created_at");

-- CreateIndex
CREATE INDEX "parcel_events_parcel_id_occurred_at_idx" ON "parcel_events"("parcel_id", "occurred_at");

-- CreateIndex
CREATE INDEX "parcel_events_occurred_at_idx" ON "parcel_events"("occurred_at");

-- CreateIndex
CREATE INDEX "parcel_events_event_type_idx" ON "parcel_events"("event_type");

-- CreateIndex
CREATE INDEX "parcel_events_action_idx" ON "parcel_events"("action");

-- CreateIndex
CREATE INDEX "payments_parcel_id_idx" ON "payments"("parcel_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "cash_accounts_code_key" ON "cash_accounts"("code");

-- CreateIndex
CREATE INDEX "cash_accounts_country_idx" ON "cash_accounts"("country");

-- CreateIndex
CREATE INDEX "cash_operations_account_id_created_at_idx" ON "cash_operations"("account_id", "created_at");

-- CreateIndex
CREATE INDEX "pricing_rules_category_origin_country_dest_country_active_idx" ON "pricing_rules"("category", "origin_country", "dest_country", "active");

-- CreateIndex
CREATE INDEX "exchange_rates_from_currency_to_currency_idx" ON "exchange_rates"("from_currency", "to_currency");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rates_from_currency_to_currency_valid_from_key" ON "exchange_rates"("from_currency", "to_currency", "valid_from");

-- CreateIndex
CREATE INDEX "audit_log_actor_id_created_at_idx" ON "audit_log"("actor_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_log_entity_entity_id_idx" ON "audit_log"("entity", "entity_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boxes" ADD CONSTRAINT "boxes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_box_id_fkey" FOREIGN KEY ("box_id") REFERENCES "boxes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcel_events" ADD CONSTRAINT "parcel_events_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "parcels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcel_events" ADD CONSTRAINT "parcel_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "parcels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_cash_account_id_fkey" FOREIGN KEY ("cash_account_id") REFERENCES "cash_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_operations" ADD CONSTRAINT "cash_operations_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "cash_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_operations" ADD CONSTRAINT "cash_operations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
