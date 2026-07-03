import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
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
import { couponOfferJsonLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";
import { stripHtml } from "@/lib/utils";

export const revalidate = 300;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://novalyticdeals.com";

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
  const coupon = await getCouponBySlug(slug);
  if (!coupon) return {};
  const store = await getStoreById(coupon.storeId);
  return buildMetadata({
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
  const coupon = await getCouponBySlug(slug);
  if (!coupon) notFound();

  const store = await getStoreById(coupon.storeId);
  if (!store) notFound();

  const relatedCoupons = await getRelatedCoupons(coupon, 4);

  return (
    <Container className="py-10">
      <JsonLd data={couponOfferJsonLd(coupon, store)} />

      <Breadcrumb
        items={[
          { name: store.name, path: `/store/${store.slug}` },
          { name: coupon.title, path: `/coupon/${coupon.slug}` },
        ]}
      />

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

          <h1 className="mt-4 font-heading text-2xl font-bold text-brand-950 sm:text-3xl">
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
