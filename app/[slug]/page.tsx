import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { RichHtml } from "@/components/ui/RichHtml";
import { JsonLd } from "@/lib/seo/JsonLdScript";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";
import { getFooterPageBySlug, getFooterPages } from "@/lib/data";
import { stripHtml } from "@/lib/utils";

// "Permanent" — cached until an admin edit purges it (purgeTag("settings:footer")
// in lib/data/settings.ts, fired on any Footer Pages save), not on a
// time-based schedule.
export const revalidate = false;

export async function generateStaticParams() {
  const pages = await getFooterPages();
  return pages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getFooterPageBySlug(slug);
  if (!page) return {};
  return await buildMetadata({
    title: page.title,
    description: stripHtml(page.description).slice(0, 160),
    path: `/${page.slug}`,
  });
}

export default async function FooterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getFooterPageBySlug(slug);
  if (!page) notFound();

  return (
    <Container className="max-w-3xl py-10">
      <JsonLd data={breadcrumbJsonLd([{ name: page.title, path: `/${page.slug}` }])} />

      <Breadcrumb items={[{ name: page.title, path: `/${page.slug}` }]} />

      <h1 className="mt-4 font-heading text-3xl font-bold text-brand-950">{page.title}</h1>

      <div className="mt-6">
        <RichHtml html={page.description} />
      </div>
    </Container>
  );
}
