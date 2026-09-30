-- CreateEnum
CREATE TYPE "PaymentTiming" AS ENUM ('at_shipping', 'at_arrival');

-- AlterEnum
ALTER TYPE "PaymentState" ADD VALUE 'partial';

-- AlterTable
ALTER TABLE "parcels" ADD COLUMN     "payment_timing" "PaymentTiming" NOT NULL DEFAULT 'at_shipping';

-- CreateIndex
CREATE INDEX "parcels_payment_timing_idx" ON "parcels"("payment_timing");
