-- CreateEnum
CREATE TYPE "RedirectType" AS ENUM ('PERMANENT', 'TEMPORARY');

-- CreateTable
CREATE TABLE "redirect_rules" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "type" "RedirectType" NOT NULL DEFAULT 'PERMANENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "redirect_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "redirect_rules_source_key" ON "redirect_rules"("source");
