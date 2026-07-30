import { notFound } from "next/navigation";

// The coupon detail page is intentionally disabled — /coupon/[slug] 404s and
// no static params are generated, so nothing links here anymore (coupon
// titles in StoreCouponCard/CouponGridCard/CouponCard render as plain text,
// and the route is excluded from the sitemap). Kept commented out below
// instead of deleted so it can be restored later without rebuilding it from
// scratch.
//
// dynamicParams = false is required for a real 404 status: without it, a
// static page whose only job is calling notFound() still gets prerendered
// as a generic static shell and served with 200 (verified against a real
// `next build && next start` — content matched not-found.tsx but the status
// stayed 200). Setting this makes any slug not in generateStaticParams
// (i.e. every slug, since that returns []) 404 at the routing layer instead.
export const dynamicParams = false;

export async function generateStaticParams() {
  return [];
}

export default async function CouponPage() {
  notFound();
}

/*
import type { Metadata } from "next";
import { Link } from "next-view-transitions";
import {
  getCouponBySlug,
  getCoupons,
  getStoreById,
  getRelatedCoupons,
} from "@/lib/data";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { StoreLogo } from "@/components/store/StoreLogo";
import { DiscountBadge } from "@/components/coupon/DiscountBadge";
import { VerifiedBadge } from "@/components/coupon/VerifiedBadge";
import { ExpirationBadge } from "@/components/coupon/ExpirationBadge";
import { CouponCodeModal } from "@/components/coupon/CouponCodeModal";
import { VoteButtons } from "@/components/coupon/VoteButtons";
import { CouponCard } from "@/components/coupon/CouponCard";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { JsonLd } from "@/lib/seo/JsonLdScript";
import { breadcrumbJsonLd, couponOfferJsonLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";
import { stripHtml } from "@/lib/utils";
import { resolveCouponContent } from "@/lib/content/defaults";
import { SITE_URL as siteUrl } from "@/lib/constants/site";

export const revalidate = 300;

export async function generateStaticParams() {
  const coupons = await getCoupons();
  return coupons.map((coupon) => ({ slug: coupon.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const rawCoupon = await getCouponBySlug(slug);
  if (!rawCoupon) return {};
  const store = await getStoreById(rawCoupon.storeId);
  const coupon = await resolveCouponContent(rawCoupon, store?.name ?? "");
  return await buildMetadata({
    title: `${coupon.title} — ${store?.name ?? ""} Coupon`,
    description: coupon.description,
    path: `/coupon/${coupon.slug}`,
    image: store?.bannerUrl,
  });
}

export default async function CouponPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const rawCoupon = await getCouponBySlug(slug);
  if (!rawCoupon) notFound();

  const store = await getStoreById(rawCoupon.storeId);
  if (!store) notFound();
  const coupon = await resolveCouponContent(rawCoupon, store.name);

  const relatedCoupons = await getRelatedCoupons(coupon, 4);

  const breadcrumbItems = [
    { name: store.name, path: `/store/${store.slug}` },
    { name: coupon.title, path: `/coupon/${coupon.slug}` },
  ];

  return (
    <Container className="py-10">
      <JsonLd data={couponOfferJsonLd(coupon, store)} />
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems)} />

      <Breadcrumb items={breadcrumbItems} />

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div className="rounded-xl border border-muted-200 bg-surface-0 p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3">
            <StoreLogo logoUrl={store.logoUrl} name={store.name} size="sm" />
            <Link href={`/store/${store.slug}`} className="font-medium text-brand-700 hover:text-brand-800">
              {store.name}
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <DiscountBadge coupon={coupon} />
            {coupon.verified && <VerifiedBadge />}
            <ExpirationBadge expiresAt={coupon.expiresAt} />
            {coupon.exclusive && <span className="text-xs font-semibold text-accent-600">Exclusive</span>}
          </div>

          <h1 className="mt-4 font-heading text-3xl font-bold text-brand-950 sm:text-4xl">
            {coupon.title}
          </h1>
          <p className="mt-3 text-muted-600">{coupon.description}</p>

          <div className="mt-6">
            <CouponCodeModal coupon={coupon} store={store} />
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-muted-200 pt-6">
            <VoteButtons couponId={coupon.id} upvotes={coupon.upvotes} downvotes={coupon.downvotes} />
            <ShareButtons url={`${siteUrl}/coupon/${coupon.slug}`} title={coupon.title} />
          </div>

          <div className="mt-8 border-t border-muted-200 pt-6">
            <h2 className="font-heading text-sm font-semibold text-brand-950">Terms & conditions</h2>
            <p className="mt-2 text-sm text-muted-600">{coupon.terms}</p>
            <p className="mt-3 text-xs text-muted-400">
              Used {coupon.usageCount.toLocaleString()} times
              {coupon.verifiedAt &&
                ` · Verified ${new Date(coupon.verifiedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}`}
            </p>
          </div>
        </div>

        <aside className="rounded-xl border border-muted-200 bg-surface-0 p-6 shadow-sm">
          <h2 className="font-heading text-sm font-semibold text-brand-950">About {store.name}</h2>
          <p className="mt-2 text-sm text-muted-600">{stripHtml(store.description)}</p>
          <Link
            href={`/store/${store.slug}`}
            className="mt-4 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            View all {store.name} coupons →
          </Link>
        </aside>
      </div>

      {relatedCoupons.length > 0 && (
        <div className="mt-14">
          <SectionHeader title={`More ${store.name} coupons`} align="left" />
          <div className="space-y-4">
            {relatedCoupons.map((related) => (
              <CouponCard key={related.id} coupon={related} store={store} />
            ))}
          </div>
        </div>
      )}
    </Container>
  );
}
*/
