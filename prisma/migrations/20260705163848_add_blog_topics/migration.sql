-- CreateTable
CREATE TABLE "blog_topics" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_topics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blog_topics_slug_key" ON "blog_topics"("slug");

-- AlterTable
ALTER TABLE "blog_posts" ADD COLUMN "topicId" TEXT;

-- CreateIndex
CREATE INDEX "blog_posts_topicId_idx" ON "blog_posts"("topicId");

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "blog_topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;
