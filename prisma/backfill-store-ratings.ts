// One-time backfill: Store.ratingCount used to be seeded with a random
// count at creation time. This recomputes rating/ratingCount from the real
// reviews table (isApproved: true only) for every existing store — rating
// falls back to 5 (not 0) when a store has no approved reviews yet, matching
// what recomputeStoreRating() now keeps in sync going forward (see
// lib/data/stores.ts). Run once via:
//   npx tsx prisma/backfill-store-ratings.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const stores = await prisma.store.findMany({ select: { id: true } });
  const approved = await prisma.review.groupBy({
    by: ["storeId"],
    where: { isApproved: true },
    _avg: { rating: true },
    _count: true,
  });
  const byStoreId = new Map(approved.map((g) => [g.storeId, g]));

  for (const store of stores) {
    const agg = byStoreId.get(store.id);
    await prisma.store.update({
      where: { id: store.id },
      data: { rating: agg?._avg.rating ?? 5, ratingCount: agg?._count ?? 0 },
    });
  }

  console.log(`Recomputed rating/ratingCount for ${stores.length} stores.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
