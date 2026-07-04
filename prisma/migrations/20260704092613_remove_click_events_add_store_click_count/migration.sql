-- Add a lifetime click counter directly on stores (Coupon.usageCount already
-- serves this role for coupons — it was incremented alongside every
-- click_events insert, so no equivalent column is needed there).
ALTER TABLE "stores" ADD COLUMN "clickCount" INTEGER NOT NULL DEFAULT 0;

-- Backfill from the per-click rows before dropping them, so existing
-- lifetime totals aren't silently lost.
UPDATE "stores" s
SET "clickCount" = sub.cnt
FROM (SELECT "storeId", COUNT(*) AS cnt FROM "click_events" GROUP BY "storeId") sub
WHERE s.id = sub."storeId";

-- DropForeignKey
ALTER TABLE "click_events" DROP CONSTRAINT IF EXISTS "click_events_couponId_fkey";
ALTER TABLE "click_events" DROP CONSTRAINT IF EXISTS "click_events_storeId_fkey";

-- DropTable
DROP TABLE "click_events";
