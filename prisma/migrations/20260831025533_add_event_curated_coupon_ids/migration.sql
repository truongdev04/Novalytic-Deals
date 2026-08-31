-- AlterTable
ALTER TABLE "events" ADD COLUMN     "curatedCouponIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
