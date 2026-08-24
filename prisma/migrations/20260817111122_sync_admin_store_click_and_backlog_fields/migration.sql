/*
  Warnings:

  - You are about to drop the column `tags` on the `blog_posts` table. All the data in the column will be lost.
  - You are about to drop the column `clickCount` on the `stores` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AdminUserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "blog_posts" DROP COLUMN "tags",
ADD COLUMN     "createdById" TEXT;

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "createdById" TEXT;

-- AlterTable
ALTER TABLE "coupons" ADD COLUMN     "createdById" TEXT;

-- AlterTable
ALTER TABLE "deals" ADD COLUMN     "createdById" TEXT;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "createdById" TEXT;

-- AlterTable
ALTER TABLE "stores" DROP COLUMN "clickCount",
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "currentMonthClicks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isPin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastMonthClicks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "seoDiscountSnapshot" TEXT,
ADD COLUMN     "seoDiscountSnapshotPeriod" TEXT,
ALTER COLUMN "categoryIds" DROP DEFAULT;

-- AlterTable
ALTER TABLE "submitted_coupons" ADD COLUMN     "discountUnit" TEXT NOT NULL DEFAULT '%',
ADD COLUMN     "discountValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "websiteUrl" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "fullDataAccess" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "fullName" TEXT,
ADD COLUMN     "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "status" "AdminUserStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "blog_posts_isFeatured_idx" ON "blog_posts"("isFeatured");

-- CreateIndex
CREATE INDEX "blog_posts_createdById_idx" ON "blog_posts"("createdById");

-- CreateIndex
CREATE INDEX "categories_isFeatured_idx" ON "categories"("isFeatured");

-- CreateIndex
CREATE INDEX "categories_createdById_idx" ON "categories"("createdById");

-- CreateIndex
CREATE INDEX "coupons_createdById_idx" ON "coupons"("createdById");

-- CreateIndex
CREATE INDEX "deals_createdById_idx" ON "deals"("createdById");

-- CreateIndex
CREATE INDEX "events_createdById_idx" ON "events"("createdById");

-- CreateIndex
CREATE INDEX "stores_isPin_idx" ON "stores"("isPin");

-- CreateIndex
CREATE INDEX "stores_createdById_idx" ON "stores"("createdById");

-- CreateIndex
CREATE INDEX "stores_categoryIds_idx" ON "stores" USING GIN ("categoryIds");
