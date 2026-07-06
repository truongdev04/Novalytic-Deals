-- Denormalize BlogAuthor onto BlogPost: authors were never a shared/browsable
-- entity (no author landing page), so each post keeps its author's
-- name/avatar as plain columns instead of an id-based join.
ALTER TABLE "blog_posts" ADD COLUMN     "authorName" TEXT;
ALTER TABLE "blog_posts" ADD COLUMN     "authorAvatarUrl" TEXT;
ALTER TABLE "blog_posts" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "blog_posts" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill from blog_authors before dropping it.
UPDATE "blog_posts" p
SET "authorName" = a."name",
    "authorAvatarUrl" = a."avatarUrl"
FROM "blog_authors" a
WHERE p."authorId" = a."id";

-- Every existing row must have resolved above; make it NOT NULL now that
-- it's backfilled.
ALTER TABLE "blog_posts" ALTER COLUMN "authorName" SET NOT NULL;

-- updatedAt has no persistent DB default going forward (matches the
-- existing stores/coupons/users convention — Prisma's @updatedAt sets it
-- on every client write); the DEFAULT above only exists to backfill
-- existing rows.
ALTER TABLE "blog_posts" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- DropForeignKey
ALTER TABLE "blog_posts" DROP CONSTRAINT IF EXISTS "blog_posts_authorId_fkey";

-- AlterTable
ALTER TABLE "blog_posts" DROP COLUMN "authorId";

-- DropTable
DROP TABLE "blog_authors";
