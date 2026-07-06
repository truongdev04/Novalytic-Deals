-- AlterTable
ALTER TABLE "events"
  ADD COLUMN     "iconImageUrl" TEXT,
  ALTER COLUMN "startsAt" DROP NOT NULL,
  ALTER COLUMN "endsAt" DROP NOT NULL;
