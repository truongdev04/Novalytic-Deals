-- AlterTable
ALTER TABLE "deals" ADD COLUMN "categoryId" TEXT,
ADD COLUMN "offer" TEXT;

-- CreateIndex
CREATE INDEX "deals_categoryId_idx" ON "deals"("categoryId");

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
