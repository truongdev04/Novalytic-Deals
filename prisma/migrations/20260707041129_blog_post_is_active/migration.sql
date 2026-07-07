-- AlterTable
ALTER TABLE "blog_posts" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "blog_posts_isActive_idx" ON "blog_posts"("isActive");
