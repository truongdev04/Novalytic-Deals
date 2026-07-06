-- Coupons curated by an event become a plain text[] column (an event still
-- curates multiple coupons, so this stays an array despite the singular
-- column name "couponId").
ALTER TABLE "events" ADD COLUMN     "couponId" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "events" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "events" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "events" e
SET "couponId" = sub.ids
FROM (
  SELECT "eventId", array_agg("couponId") AS ids
  FROM "event_coupons"
  GROUP BY "eventId"
) sub
WHERE e.id = sub."eventId";

-- updatedAt has no persistent DB default going forward (Prisma's
-- @updatedAt sets it on every client write); the DEFAULT above only exists
-- to backfill existing rows.
ALTER TABLE "events" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- DropForeignKey (event_coupons)
ALTER TABLE "event_coupons" DROP CONSTRAINT IF EXISTS "event_coupons_eventId_fkey";
ALTER TABLE "event_coupons" DROP CONSTRAINT IF EXISTS "event_coupons_couponId_fkey";

-- DropTable
DROP TABLE "event_coupons";

-- event_stores has no replacement column on Event — Store.eventId (added in
-- the previous migration) is the sole source of truth going forward.
ALTER TABLE "event_stores" DROP CONSTRAINT IF EXISTS "event_stores_eventId_fkey";
ALTER TABLE "event_stores" DROP CONSTRAINT IF EXISTS "event_stores_storeId_fkey";

DROP TABLE "event_stores";
