-- Complete the operational record captured when a parcel is deposited.
ALTER TABLE "parcels"
  ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "declared_value_currency" "Currency",
  ADD COLUMN "length_cm" DECIMAL(10,2),
  ADD COLUMN "width_cm" DECIMAL(10,2),
  ADD COLUMN "height_cm" DECIMAL(10,2),
  ADD COLUMN "is_fragile" BOOLEAN NOT NULL DEFAULT false;

-- Earlier records stored a declared value without its currency. They were
-- entered on the US intake flow, where the declared amount is USD.
UPDATE "parcels"
SET "declared_value_currency" = 'USD'
WHERE "declared_value" IS NOT NULL;
