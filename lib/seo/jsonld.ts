import { getGeneralSettings, getSocialSettings } from "@/lib/data";
import { resolveImageUrl } from "@/lib/seo/metadata";
import type { BlogPost, Coupon, Store } from "@/types";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://novalyticdeals.com";

export async function organizationJsonLd() {
  const [general, social] = await Promise.all([getGeneralSettings(), getSocialSettings()]);
  const sameAs = [
    social.facebookUrl,
    social.tiktokUrl,
    social.instagramUrl,
    social.xUrl,
    social.youtubeUrl,
  ].filter((url): url is string => Boolean(url));
  const logo = general.logoUrl
    ? resolveImageUrl(general.logoUrl)
    : general.faviconUrl
      ? resolveImageUrl(general.faviconUrl)
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: general.companyName || general.title || "NovalyticDeals",
    url: siteUrl,
    logo,
    sameAs,
    telephone: general.hotline || undefined,
    email: general.email || undefined,
    address: general.address || undefined,
  };
}

export async function websiteJsonLd() {
  const general = await getGeneralSettings();

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: general.title || "NovalyticDeals",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.path}`,
    })),
  };
}

export function couponOfferJsonLd(coupon: Coupon, store: Store) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: coupon.title,
    description: coupon.description,
    brand: {
      "@type": "Brand",
      name: store.name,
    },
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/coupon/${coupon.slug}`,
      priceCurrency: coupon.currency === "€" ? "EUR" : "USD",
      price: "0",
      availability: "https://schema.org/InStock",
      validFrom: coupon.startsAt,
      ...(coupon.expiresAt ? { priceValidUntil: coupon.expiresAt } : {}),
    },
  };
}

export function faqPageJsonLd(faq: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function articleJsonLd(post: BlogPost) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: `${siteUrl}${post.coverImage}`,
    datePublished: post.publishedAt,
    author: {
      "@type": "Person",
      name: post.authorName,
    },
  };
}

export function storeAggregateRatingJsonLd(store: Store) {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: store.name,
    url: store.website,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: store.rating,
      reviewCount: store.ratingCount,
    },
  };
}
