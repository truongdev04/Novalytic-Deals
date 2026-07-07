import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getBlogPostBySlug, getBlogPosts, getRelatedBlogPosts } from "@/lib/data";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { Badge } from "@/components/ui/Badge";
import { RichHtml } from "@/components/ui/RichHtml";
import { JsonLd } from "@/lib/seo/JsonLdScript";
import { articleJsonLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";
import { parseBlogSections } from "@/lib/blog";
import { formatDate } from "@/lib/utils";

export const revalidate = 300;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://novalyticdeals.com";

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return {};
  return await buildMetadata({
    title: post.seo.title,
    description: post.seo.description,
    path: `/blog/${post.slug}`,
    image: post.coverImage,
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const relatedPosts = await getRelatedBlogPosts(post, 3);
  const sections = parseBlogSections(post.body);

  return (
    <Container className="py-10">
      <JsonLd data={articleJsonLd(post)} />

      <Breadcrumb items={[{ name: "Blog", path: "/blog" }, { name: post.title, path: `/blog/${post.slug}` }]} />

      <article className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_260px]">
        <div>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="brand">
                {tag}
              </Badge>
            ))}
          </div>

          <h1 className="mt-4 font-heading text-3xl font-bold text-brand-950">{post.title}</h1>

          <div className="mt-3 flex items-center gap-3 text-sm text-muted-500">
            <span>{post.authorName}</span>
            <span>·</span>
            <span>{formatDate(post.publishedAt)}</span>
            <span>·</span>
            <span>{post.readingMinutes} min read</span>
          </div>

          <div className="relative mt-6 aspect-video w-full overflow-hidden rounded-xl">
            <Image src={post.coverImage} alt={post.title} fill sizes="100vw" className="object-cover" priority />
          </div>

          <div className="mt-8 space-y-8">
            {sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="font-heading text-xl font-semibold text-brand-950">{section.heading}</h2>
                <RichHtml
                  html={section.bodyHtml}
                  className="mt-3 space-y-4 text-muted-700 leading-relaxed"
                />
              </section>
            ))}
          </div>

          <div className="mt-10 border-t border-muted-200 pt-6">
            <ShareButtons url={`${siteUrl}/blog/${post.slug}`} title={post.title} />
          </div>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <TableOfContents sections={sections} />
        </aside>
      </article>

      <div className="mt-16">
        <RelatedPosts posts={relatedPosts} />
      </div>
    </Container>
  );
}
