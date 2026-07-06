-- Backfill-safe defaults for existing rows; updatedAt columns drop their
-- default afterward to match the existing stores/coupons/users convention
-- (Prisma's @updatedAt sets it on every client write instead).
ALTER TABLE "categories" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "categories" ALTER COLUMN "updatedAt" DROP DEFAULT;

ALTER TABLE "reviews" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "reviews" ALTER COLUMN "updatedAt" DROP DEFAULT;

ALTER TABLE "newsletter_subscribers" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "newsletter_subscribers" ALTER COLUMN "updatedAt" DROP DEFAULT;

ALTER TABLE "submitted_coupons" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "submitted_coupons" ALTER COLUMN "updatedAt" DROP DEFAULT;

ALTER TABLE "site_settings" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "site_settings" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "site_settings" ALTER COLUMN "updatedAt" DROP DEFAULT;
