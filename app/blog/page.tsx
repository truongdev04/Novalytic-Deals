import type { Metadata } from "next";
import { getBlogPosts } from "@/lib/data";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { BlogCard } from "@/components/blog/BlogCard";
import { CategoryChip } from "@/components/category/CategoryChip";
import { Newsletter } from "@/components/ui/Newsletter";
import { EmptyState } from "@/components/ui/EmptyState";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 300;

export const metadata: Metadata = buildMetadata({
  title: "Blog — Shopping Tips, Guides & Savings Advice",
  description: "Tips, guides, and insights to help you save more on every purchase.",
  path: "/blog",
});

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  const posts = await getBlogPosts();
  const allTags = [...new Set(posts.flatMap((p) => p.tags))];
  const filteredPosts = tag ? posts.filter((p) => p.tags.includes(tag)) : posts;

  return (
    <Container className="py-10">
      <Breadcrumb items={[{ name: "Blog", path: "/blog" }]} />

      <div className="mt-4">
        <h1 className="font-heading text-3xl font-bold text-brand-950">Blog</h1>
        <p className="mt-2 text-muted-600">Tips, guides, and insights to help you save more</p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_260px]">
        <div>
          <h2 className="mb-6 text-center font-heading text-2xl font-semibold text-brand-950 lg:text-left">
            Latest articles
          </h2>
          {filteredPosts.length === 0 ? (
            <EmptyState title="No articles found" description="Try browsing all articles instead." />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {filteredPosts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-8">
          <div>
            <h2 className="font-heading text-sm font-semibold text-brand-950">Topics</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <CategoryChip name="All" href="/blog" active={!tag} />
              {allTags.map((t) => (
                <CategoryChip key={t} name={t} href={`/blog?tag=${encodeURIComponent(t)}`} active={tag === t} />
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-muted-200 bg-surface-0 p-5">
            <h2 className="font-heading text-sm font-semibold text-brand-950">Newsletter</h2>
            <p className="mt-2 text-sm text-muted-600">Get the latest deals delivered to your inbox.</p>
            <div className="mt-4">
              <Newsletter />
            </div>
          </div>
        </aside>
      </div>
    </Container>
  );
}
