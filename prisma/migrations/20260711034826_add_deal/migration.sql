-- CreateEnum
CREATE TYPE "DealType" AS ENUM ('DEAL', 'CODE');

-- CreateTable
CREATE TABLE "deals" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DealType" NOT NULL,
    "code" TEXT,
    "eventId" TEXT,
    "originalPrice" DOUBLE PRECISION,
    "price" DOUBLE PRECISION NOT NULL,
    "url" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "description" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "deals_slug_key" ON "deals"("slug");

-- CreateIndex
CREATE INDEX "deals_storeId_idx" ON "deals"("storeId");

-- CreateIndex
CREATE INDEX "deals_eventId_idx" ON "deals"("eventId");

-- CreateIndex
CREATE INDEX "deals_isFeatured_idx" ON "deals"("isFeatured");

-- CreateIndex
CREATE INDEX "deals_isActive_idx" ON "deals"("isActive");

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
