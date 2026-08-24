import { createStore, getStoreBySlug, getAllStores } from "./stores";
import { createCoupon } from "./coupons";
import type {
  ParsedAutoFillWorkbook,
  StoreRowError,
  CouponRowError,
  ReviewNote,
} from "@/lib/parseAutoFillWorkbook";

export interface AutoFillStoreSummary {
  row: number;
  name: string;
  slug: string;
}
export interface AutoFillCouponSummary {
  row: number;
  title: string;
  storeName: string;
}

export interface AutoFillImportResult {
  stores: { created: AutoFillStoreSummary[]; reused: AutoFillStoreSummary[]; errors: StoreRowError[] };
  coupons: { created: AutoFillCouponSummary[]; errors: CouponRowError[] };
  reviewNotes: ReviewNote[];
}

// Preview and commit share this single implementation (toggled by dryRun) so
// the two can never disagree about what's "new" vs. "reused" — processed
// sequentially (not Promise.all) since coupons depend on their store's
// resolved id, and within-file duplicate store names must resolve in order.
async function runAutoFillImport(
  parsed: ParsedAutoFillWorkbook,
  { dryRun, createdById }: { dryRun: boolean; createdById?: string }
): Promise<AutoFillImportResult> {
  // Unfiltered — a hidden/inactive existing store still counts as "reused".
  const existingStores = await getAllStores();
  const slugToId = new Map<string, string>(existingStores.map((s) => [s.slug, s.id]));

  const created: AutoFillStoreSummary[] = [];
  const reused: AutoFillStoreSummary[] = [];
  const storeErrors: StoreRowError[] = [...parsed.storeErrors];
  // Slugs actually created new in THIS run — separate from slugToId (which
  // also holds reused/pre-existing slugs) so the coupon loop below can tell
  // "brand new store" apart from "already existed". Policy: coupons only
  // get created alongside a brand-new store; a reused (already-existing)
  // store's coupons in the file are skipped, to avoid re-creating duplicate
  // coupons whenever a file with overlapping stores gets re-imported.
  const createdSlugs = new Set<string>();

  for (const { row, input } of parsed.stores) {
    if (slugToId.has(input.slug)) {
      reused.push({ row, name: input.name, slug: input.slug });
      continue;
    }

    if (dryRun) {
      created.push({ row, name: input.name, slug: input.slug });
      createdSlugs.add(input.slug);
      // Placeholder so a duplicate name later in this same file resolves to
      // "reused" in the preview too — never read as a real id in dry-run mode.
      slugToId.set(input.slug, input.slug);
      continue;
    }

    try {
      // Same glue as app/api/admin/stores/route.ts — region/rating aren't
      // collected from any form for auto-filled stores either; rating
      // defaults to 5 until real reviews get approved.
      const store = await createStore({
        slug: input.slug,
        name: input.name,
        logoUrl: input.logoUrl,
        bannerUrl: input.bannerUrl || null,
        website: input.website,
        description: input.description || "",
        aboutStore: input.aboutStore || "",
        howToApply: input.howToApply || null,
        rating: 5,
        ratingCount: 0,
        region: "GLOBAL",
        affiliateNetwork: input.affiliateNetwork,
        categoryIds: input.categoryIds,
        isFeatured: input.isFeatured,
        isPin: input.isPin,
        seo: { title: input.seoTitle || "", description: input.seoDescription || "" },
        faq: input.faq,
        createdById: createdById!,
      });
      slugToId.set(store.slug, store.id);
      created.push({ row, name: input.name, slug: input.slug });
      createdSlugs.add(store.slug);
    } catch (error) {
      if (error instanceof Error && error.message === "SLUG_TAKEN") {
        // Rare race between the dedup read above and this write — the store
        // exists after all, so fall back to reusing it.
        const existing = await getStoreBySlug(input.slug);
        if (existing) {
          slugToId.set(existing.slug, existing.id);
          reused.push({ row, name: input.name, slug: input.slug });
          continue;
        }
      }
      // Unexpected DB error for this one store (data itself already passed
      // Zod validation at parse time, so this isn't a bad-input problem) —
      // record it and move on to the next store instead of aborting the
      // whole batch. slugToId is left unset for this slug, so its coupons
      // fall into the "store not found" branch below instead of silently
      // attaching to nothing.
      storeErrors.push({
        row,
        name: input.name,
        message: error instanceof Error ? error.message : "Lỗi không xác định khi tạo store.",
      });
    }
  }

  const couponsCreated: AutoFillCouponSummary[] = [];
  const couponErrors: CouponRowError[] = [...parsed.couponErrors];

  for (const { row, storeName, storeSlug, input } of parsed.coupons) {
    if (!slugToId.has(storeSlug)) {
      // Store for this coupon either failed validation at parse time
      // (parseAutoFillWorkbook already excludes those coupons — this is a
      // defensive fallback) or failed to create/reuse during commit above —
      // either way it was never created/reused, so skip this coupon too.
      couponErrors.push({
        row,
        title: input.title,
        storeName,
        message: "Store bị lỗi nên coupon này cũng bị bỏ qua.",
      });
      continue;
    }

    if (!createdSlugs.has(storeSlug)) {
      // Store already existed (reused, not created new this run) — skip its
      // coupons too, per policy, so re-importing a file whose stores were
      // already onboarded doesn't create duplicate coupons for them. Not an
      // error (expected/intentional), so it's silently skipped rather than
      // reported in couponErrors — only genuine errors get surfaced there.
      continue;
    }

    if (dryRun) {
      couponsCreated.push({ row, title: input.title, storeName });
      continue;
    }

    const storeId = slugToId.get(storeSlug)!;
    try {
      // Same glue as app/api/admin/coupons/route.ts — startsAt/expiresAt are
      // never provided by this Excel format, so always "now" / no expiry.
      await createCoupon({
        storeId,
        slug: input.slug,
        title: input.title,
        description: input.description,
        type: input.type,
        code: input.code || null,
        discountType: input.discountType,
        discountValue: input.discountValue,
        currency: input.currency,
        affiliateUrl: input.affiliateUrl,
        exclusive: input.exclusive,
        verified: input.verified,
        terms: input.terms,
        startsAt: new Date(),
        expiresAt: null,
        isFeatured: input.isFeatured,
        createdById: createdById!,
      });
      couponsCreated.push({ row, title: input.title, storeName });
    } catch (error) {
      if (error instanceof Error && error.message === "SLUG_TAKEN") {
        couponErrors.push({ row, title: input.title, storeName, message: "Slug coupon bị trùng, thử lại." });
        continue;
      }
      throw error;
    }
  }

  return {
    stores: { created, reused, errors: storeErrors },
    coupons: { created: couponsCreated, errors: couponErrors },
    reviewNotes: parsed.reviewNotes,
  };
}

export async function previewAutoFillImport(parsed: ParsedAutoFillWorkbook): Promise<AutoFillImportResult> {
  return runAutoFillImport(parsed, { dryRun: true });
}

export async function commitAutoFillImport(
  parsed: ParsedAutoFillWorkbook,
  createdById: string
): Promise<AutoFillImportResult> {
  return runAutoFillImport(parsed, { dryRun: false, createdById });
}
