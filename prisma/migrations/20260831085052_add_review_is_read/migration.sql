-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "reviews_isRead_idx" ON "reviews"("isRead");
