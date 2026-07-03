-- AlterTable
ALTER TABLE "coupons" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "coupons_isActive_idx" ON "coupons"("isActive");
