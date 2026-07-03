-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "stores_isActive_idx" ON "stores"("isActive");
