// One-time content fix from the 2026-07-27 QA report (public/images/anh/test.md):
// 1. Store SEO titles ending up as "... NovalyticDeals | NovalyticDeals" — the
//    site-wide title template (or a store's own override) had the brand name
//    typed directly into it, then got the global "%s | NovalyticDeals" suffix
//    applied on top (see app/layout.tsx).
// 2. Store "How to apply" copy telling users to click "GET CODE", when the
//    actual button reads "Show Code" (see CouponCodeModal.tsx / DealProductCard.tsx).
//
// Logs every match found/changed before writing — review the output before
// trusting it against production data. Run once via:
//   npx tsx prisma/fix-content-copy.ts

import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const CONTENT_CONFIG_KEY = "content_config";
const BRAND_SUFFIX_RE = /\s*[-–—|]\s*NovalyticDeals\s*$/i;
const GET_CODE_RE = /GET CODE/gi;

interface StoreSeo {
  title?: string;
  description?: string;
}

async function fixContentConfigTemplates() {
  const row = await prisma.siteSetting.findUnique({ where: { key: CONTENT_CONFIG_KEY } });
  if (!row) {
    console.log("[content_config] no row found, skipping");
    return;
  }

  const value = row.value as { templates?: Record<string, unknown> };
  const templates = { ...(value.templates ?? {}) } as Record<string, unknown>;
  let changed = false;

  const titleTemplate = templates.storeSeoTitleTemplate;
  if (typeof titleTemplate === "string" && BRAND_SUFFIX_RE.test(titleTemplate)) {
    const fixed = titleTemplate.replace(BRAND_SUFFIX_RE, "");
    console.log(`[content_config] storeSeoTitleTemplate:\n  before: ${titleTemplate}\n  after:  ${fixed}`);
    templates.storeSeoTitleTemplate = fixed;
    changed = true;
  }

  const howToApplyTemplate = templates.storeHowToApplyTemplate;
  if (typeof howToApplyTemplate === "string" && GET_CODE_RE.test(howToApplyTemplate)) {
    const fixed = howToApplyTemplate.replace(GET_CODE_RE, "Show Code");
    console.log(
      `[content_config] storeHowToApplyTemplate:\n  before: ${howToApplyTemplate}\n  after:  ${fixed}`
    );
    templates.storeHowToApplyTemplate = fixed;
    changed = true;
  }

  if (!changed) {
    console.log("[content_config] no matches, nothing to change");
    return;
  }

  await prisma.siteSetting.update({
    where: { key: CONTENT_CONFIG_KEY },
    data: { value: { ...value, templates } as unknown as Prisma.InputJsonValue },
  });
  console.log("[content_config] updated");
}

async function fixStoreOverrides() {
  const stores = await prisma.store.findMany({ select: { id: true, slug: true, seo: true, howToApply: true } });
  let updatedCount = 0;

  for (const store of stores) {
    const seo = store.seo as unknown as StoreSeo;
    let seoChanged = false;
    let nextSeo = seo;

    if (seo?.title && BRAND_SUFFIX_RE.test(seo.title)) {
      const fixedTitle = seo.title.replace(BRAND_SUFFIX_RE, "");
      console.log(`[store:${store.slug}] seo.title:\n  before: ${seo.title}\n  after:  ${fixedTitle}`);
      nextSeo = { ...seo, title: fixedTitle };
      seoChanged = true;
    }

    let nextHowToApply = store.howToApply;
    let howToApplyChanged = false;
    if (store.howToApply && GET_CODE_RE.test(store.howToApply)) {
      nextHowToApply = store.howToApply.replace(GET_CODE_RE, "Show Code");
      console.log(
        `[store:${store.slug}] howToApply:\n  before: ${store.howToApply}\n  after:  ${nextHowToApply}`
      );
      howToApplyChanged = true;
    }

    if (!seoChanged && !howToApplyChanged) continue;

    await prisma.store.update({
      where: { id: store.id },
      data: {
        ...(seoChanged ? { seo: nextSeo as unknown as Prisma.InputJsonValue } : {}),
        ...(howToApplyChanged ? { howToApply: nextHowToApply } : {}),
      },
    });
    updatedCount += 1;
  }

  console.log(`[stores] updated ${updatedCount} of ${stores.length} store(s)`);
}

async function main() {
  await fixContentConfigTemplates();
  await fixStoreOverrides();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
