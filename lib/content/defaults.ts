import { getDefaultAuthor, getContentConfigSettings } from "@/lib/data";
import {
  applyTemplate,
  applyTemplateVars,
  pickRandomLine,
  pickRandomBlock,
  pickFaqSet,
  flattenBlock,
  blockToHtml,
  getUtcMonthName,
} from "@/lib/content/template";
import { resolveStoreDiscountLabel } from "@/lib/content/storeSeoSnapshot";
import type { Store, BlogPost, Coupon, StoreFaqTemplateItem } from "@/types";

// Fills in Store fields left blank by the admin, using the site-wide
// templates from Content Configuration settings. Never called from
// lib/data/stores.ts or the admin edit form — those must always show the
// real (possibly empty) saved values, not fabricated auto-fill content.
//
// Description supports multiple multi-line candidates (separated by a blank
// line, see splitTemplateBlocks) — a random candidate is picked per resolve
// call so stores left blank don't all show the exact same text.
//
// SEO title/description instead use ONE fixed structure shared by every
// store, with {name}/{discount}/{month}/{year} placeholders — {discount} is
// frozen for the current UTC month (resolveStoreDiscountLabel), and a
// separate fallback structure is used for stores with no qualifying coupon
// this period (also frozen, not re-checked live — see
// lib/content/storeSeoSnapshot.ts).
export async function resolveStoreContent(store: Store): Promise<Store> {
  const config = await getContentConfigSettings();
  const t = config.templates;
  const name = store.name;

  // Description renders as HTML (RichHtml) — convert the candidate's line
  // breaks into <br> so they actually show, instead of collapsing into one
  // run-on line the way raw "\n" would in HTML.
  const descriptionBlock = applyTemplate(pickRandomBlock(t.storeDescriptionTemplate), name);

  const needsSeoFill = !store.seo.title || !store.seo.description;
  let seoTitle = "";
  let seoDescription = "";
  if (needsSeoFill) {
    const discountLabel = await resolveStoreDiscountLabel(store);
    const now = new Date();
    const vars = {
      name,
      discount: discountLabel ?? "",
      month: getUtcMonthName(now),
      year: String(now.getUTCFullYear()),
    };
    const titleTemplate = discountLabel !== null ? t.storeSeoTitleTemplate : t.storeSeoTitleFallbackTemplate;
    const descriptionTemplate =
      discountLabel !== null ? t.storeSeoDescriptionTemplate : t.storeSeoDescriptionFallbackTemplate;
    seoTitle = flattenBlock(applyTemplateVars(titleTemplate, vars));
    seoDescription = flattenBlock(applyTemplateVars(descriptionTemplate, vars));
  }

  return {
    ...store,
    description: store.description || blockToHtml(descriptionBlock),
    aboutStore: store.aboutStore || applyTemplate(t.storeAboutTemplate, name),
    howToApply: store.howToApply || applyTemplate(t.storeHowToApplyTemplate, name) || undefined,
    faq:
      store.faq.length > 0
        ? store.faq
        : (pickFaqSet(store.id, t.storeFaqTemplateSets ?? [])?.items ?? []).map((item) => ({
            question: applyTemplate(item.question, name),
            answer: applyTemplate(item.answer, name),
          })),
    seo: {
      title: store.seo.title || seoTitle,
      description: store.seo.description || seoDescription,
    },
  };
}

// Same idea as resolveStoreContent, but for Coupon — never called from
// lib/data/coupons.ts or the admin edit form, only the public coupon page.
// {name} resolves to the coupon's store name (not the coupon title), since
// coupon templates read like "Save more at {name}" / "Discount applies at
// checkout on {name}'s website" — the store is the subject, not the coupon.
//
// This is a safety net for coupons whose description/terms are still empty
// in the DB (created outside the admin form, or cleared on edit) — a new
// coupon created via CouponForm.tsx already gets a template filled in and
// saved for real at creation time, so this rarely fires for those.
// Description is one candidate per line, Terms supports multi-line
// candidates separated by a blank line (see lib/content/template.ts).
export async function resolveCouponContent(coupon: Coupon, storeName: string): Promise<Coupon> {
  const config = await getContentConfigSettings();
  const t = config.templates;

  return {
    ...coupon,
    description:
      coupon.description || applyTemplate(pickRandomLine(t.couponDescriptionTemplate), storeName),
    terms: coupon.terms || applyTemplate(pickRandomBlock(t.couponTermsTemplate), storeName),
  };
}

// Same idea as resolveStoreContent, but for BlogPost — also falls back to
// the site-wide Author settings when a post has no author set.
export async function resolveBlogContent(post: BlogPost): Promise<BlogPost> {
  const [config, author] = await Promise.all([getContentConfigSettings(), getDefaultAuthor()]);
  const t = config.templates;
  const name = post.title;

  return {
    ...post,
    excerpt: post.excerpt || applyTemplate(t.blogExcerptTemplate, name),
    authorName: post.authorName || author?.name || "",
    authorAvatarUrl: post.authorAvatarUrl || author?.avatarUrl,
    seo: {
      title: post.seo.title || applyTemplate(t.blogSeoTitleTemplate, name),
      description: post.seo.description || applyTemplate(t.blogSeoDescriptionTemplate, name),
    },
  };
}

// Events have no per-event faq field — unlike Store/Category, every event's
// FAQ block is generated from the single site-wide eventFaqTemplate (with
// {name} resolving to the event's name), not admin-editable per event.
export async function resolveEventFaq(eventName: string): Promise<StoreFaqTemplateItem[]> {
  const config = await getContentConfigSettings();
  const t = config.templates;
  return (t.eventFaqTemplate ?? []).map((item) => ({
    question: applyTemplate(item.question, eventName),
    answer: applyTemplate(item.answer, eventName),
  }));
}
