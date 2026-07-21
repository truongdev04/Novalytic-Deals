import type { Metadata } from "next";
import { getBlogPostCards, getFeaturedBlogPosts, getBlogTopics } from "@/lib/data";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { BlogCard } from "@/components/blog/BlogCard";
import { BlogHero } from "@/components/blog/BlogHero";
import { BlogPostGrid } from "@/components/blog/BlogPostGrid";
import { CategoryChip } from "@/components/category/CategoryChip";
import { Newsletter } from "@/components/ui/Newsletter";
import { EmptyState } from "@/components/ui/EmptyState";
import { buildMetadata } from "@/lib/seo/metadata";
import type { BlogPost } from "@/types";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Blog — Shopping Tips, Guides & Savings Advice",
    description: "Tips, guides, and insights to help you save more on every purchase.",
    path: "/blog",
  });
}

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic } = await searchParams;
  const [posts, featuredPosts, topics] = await Promise.all([
    getBlogPostCards(),
    getFeaturedBlogPosts(4),
    getBlogTopics(),
  ]);

  const heroPost: BlogPost | undefined = posts.find((p) => p.isFirst) ?? featuredPosts[0] ?? posts[0];
  const featuredRow = featuredPosts.filter((p) => p.id !== heroPost?.id).slice(0, 3);

  const topicsWithPosts = topics.filter((t) => posts.some((p) => p.topicId === t.id));
  const activeTopic = topic ? topicsWithPosts.find((t) => t.slug === topic) : undefined;
  const filteredPosts = activeTopic ? posts.filter((p) => p.topicId === activeTopic.id) : posts;

  return (
    <>
      <Container className="py-10">
        <Breadcrumb items={[{ name: "Blog", path: "/blog" }]} />
        <h1 className="sr-only">Blog</h1>

        <div className="mt-6 space-y-16">
          {heroPost && <BlogHero post={heroPost} />}

          {featuredRow.length > 0 && (
            <div>
              <SectionHeader title="Featured" align="left" />
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featuredRow.map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          )}

          <div>
            <SectionHeader title="Latest" align="left" />

            <div className="mb-6 flex flex-wrap gap-2">
              <CategoryChip name="All" href="/blog" active={!activeTopic} />
              {topicsWithPosts.map((t) => (
                <CategoryChip key={t.id} name={t.name} href={`/blog?topic=${t.slug}`} active={activeTopic?.id === t.id} />
              ))}
            </div>

            {filteredPosts.length === 0 ? (
              <EmptyState title="No articles found" description="Try browsing all articles instead." />
            ) : (
              <BlogPostGrid key={topic ?? "all"} posts={filteredPosts} />
            )}
          </div>
        </div>
      </Container>

      <section className="bg-brand-700">
        <Container className="flex flex-col items-center gap-6 py-14 text-center">
          <div>
            <h2 className="font-heading text-2xl font-semibold text-white sm:text-3xl">
              Get the best deals delivered to your inbox
            </h2>
            <p className="mt-2 text-brand-100">
              Subscribe to our newsletter and never miss out on exclusive offers.
            </p>
          </div>
          <div className="w-full max-w-md">
            <Newsletter variant="footer" />
          </div>
        </Container>
      </section>
    </>
  );
}
