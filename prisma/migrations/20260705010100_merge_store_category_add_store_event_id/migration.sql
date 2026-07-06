-- Denormalize the store<->category join into a Postgres text[] column
-- (matches types/store.ts's Store.categoryIds shape, already a plain array
-- everywhere outside the Prisma layer).
ALTER TABLE "stores" ADD COLUMN     "categoryIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Formalize the existing "a store belongs to at most one event" invariant
-- (previously only enforced in application code via event_stores) as a
-- real nullable FK column.
ALTER TABLE "stores" ADD COLUMN     "eventId" TEXT;

-- Backfill categoryIds via array_agg over the join table.
UPDATE "stores" s
SET "categoryIds" = sub.ids
FROM (
  SELECT "storeId", array_agg("categoryId") AS ids
  FROM "store_categories"
  GROUP BY "storeId"
) sub
WHERE s.id = sub."storeId";

-- Backfill eventId — DISTINCT ON forces a deterministic pick (lowest
-- eventId wins) for the small number of stores that today's event_stores
-- data links to more than one event, since Store.eventId can only hold one.
UPDATE "stores" s
SET "eventId" = sub."eventId"
FROM (
  SELECT DISTINCT ON ("storeId") "storeId", "eventId"
  FROM "event_stores"
  ORDER BY "storeId", "eventId"
) sub
WHERE s.id = sub."storeId";

-- DropForeignKey
ALTER TABLE "store_categories" DROP CONSTRAINT IF EXISTS "store_categories_storeId_fkey";
ALTER TABLE "store_categories" DROP CONSTRAINT IF EXISTS "store_categories_categoryId_fkey";

-- DropTable
DROP TABLE "store_categories";

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "stores_eventId_idx" ON "stores"("eventId");
