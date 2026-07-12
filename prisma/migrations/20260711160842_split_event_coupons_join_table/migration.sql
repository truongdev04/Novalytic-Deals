-- Split Event.couponId (denormalized text[]) back into a proper join table
-- with real FKs, so deleting a coupon/store cascades cleanup automatically
-- instead of relying on manual array-filtering code (see lib/data/stores.ts
-- deleteStore, which previously had to hunt down and rewrite every event's
-- couponId array by hand).

-- CreateTable
CREATE TABLE "event_coupons" (
    "eventId" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_coupons_pkey" PRIMARY KEY ("eventId","couponId")
);

CREATE INDEX "event_coupons_couponId_idx" ON "event_coupons"("couponId");

-- Backfill from the existing events.couponId array.
INSERT INTO "event_coupons" ("eventId", "couponId")
SELECT e.id, unnest(e."couponId")
FROM "events" e
WHERE array_length(e."couponId", 1) > 0
ON CONFLICT DO NOTHING;

-- Drop any backfilled rows pointing at coupon ids that no longer exist
-- (stale entries the old String[] cleanup path could miss) before adding
-- the FK constraint below.
DELETE FROM "event_coupons" ec
WHERE NOT EXISTS (SELECT 1 FROM "coupons" c WHERE c.id = ec."couponId");

-- updatedAt has no persistent DB default going forward (Prisma's
-- @updatedAt sets it on every client write); the DEFAULT above only exists
-- to backfill existing rows.
ALTER TABLE "event_coupons" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "event_coupons" ADD CONSTRAINT "event_coupons_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_coupons" ADD CONSTRAINT "event_coupons_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropColumn
ALTER TABLE "events" DROP COLUMN "couponId";
