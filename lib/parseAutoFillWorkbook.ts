import * as XLSX from "xlsx";
import { slugify } from "@/lib/utils";
import { blockToHtml } from "@/lib/content/template";
import { adminStoreSchema, type AdminStoreInput } from "@/lib/validators/admin/store";
import { adminCouponSchema, type AdminCouponInput } from "@/lib/validators/admin/coupon";

export const MAX_WORKBOOK_SIZE_BYTES = 10 * 1024 * 1024;

export interface ParsedStoreRow {
  row: number;
  input: AdminStoreInput;
}
export interface StoreRowError {
  row: number;
  name: string;
  message: string;
}

export interface ParsedCouponRow {
  row: number;
  storeName: string;
  storeSlug: string;
  input: Omit<AdminCouponInput, "storeId">;
}
export interface CouponRowError {
  row: number;
  title: string;
  storeName: string;
  message: string;
}

export interface ReviewNote {
  row: string;
  store: string;
  issue: string;
}

export interface ParsedAutoFillWorkbook {
  stores: ParsedStoreRow[];
  storeErrors: StoreRowError[];
  coupons: ParsedCouponRow[];
  couponErrors: CouponRowError[];
  reviewNotes: ReviewNote[];
}

interface RawStoreRow {
  name?: unknown;
  link_website?: unknown;
  link_affiliate?: unknown;
  description?: unknown;
  about_store?: unknown;
}

interface RawCouponRow {
  store_name?: unknown;
  title?: unknown;
  type?: unknown;
  code?: unknown;
  discount_type?: unknown;
  discount_value?: unknown;
  currency?: unknown;
  link_affiliate?: unknown;
  exclusive?: unknown;
}

interface RawReviewRow {
  row?: unknown;
  store?: unknown;
  issue?: unknown;
}

// Real workbooks from Tool Auto Fill store every cell as plain text (even
// "numeric"/"boolean"-looking ones), so every field must be coerced through
// this rather than trusted to already be the right JS type.
function toStr(value: unknown): string {
  return String(value ?? "").trim();
}

// Mirrors generateRandomCode() in components/admin/CouponForm.tsx exactly
// (same alphabet/length/crypto source) — kept local here rather than shared
// since that one's a client-only helper, not exported from a shared module.
function randomCode(length = 12): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

function issuesToMessage(issues: { message: string }[]): string {
  return issues.map((issue) => issue.message).join("; ");
}

export function parseAutoFillWorkbook(buffer: Buffer): ParsedAutoFillWorkbook {
  const workbook = XLSX.read(buffer, { type: "buffer" });

  const storesSheet = workbook.Sheets["Stores"];
  const couponsSheet = workbook.Sheets["Coupons"];
  if (!storesSheet) throw new Error('Không tìm thấy sheet "Stores" trong file.');
  if (!couponsSheet) throw new Error('Không tìm thấy sheet "Coupons" trong file.');

  const rawStores = XLSX.utils.sheet_to_json<RawStoreRow>(storesSheet, { defval: "" });
  const rawCoupons = XLSX.utils.sheet_to_json<RawCouponRow>(couponsSheet, { defval: "" });
  const reviewSheet = workbook.Sheets["Review"];
  const rawReview = reviewSheet
    ? XLSX.utils.sheet_to_json<RawReviewRow>(reviewSheet, { defval: "" })
    : [];

  const stores: ParsedStoreRow[] = [];
  const storeErrors: StoreRowError[] = [];
  // Every attempted slug (valid or not) vs. only the valid ones — a coupon
  // whose store slug falls in the gap between the two gets a distinct,
  // more useful error ("parent store failed") instead of "store not found".
  const attemptedSlugs = new Set<string>();
  const validSlugs = new Set<string>();

  rawStores.forEach((raw, index) => {
    const row = index + 2; // header is row 1 in the spreadsheet the admin sees
    const name = toStr(raw.name);
    const slug = slugify(name);
    attemptedSlugs.add(slug);

    const candidate: AdminStoreInput = {
      slug,
      name,
      logoUrl: "",
      bannerUrl: "",
      website: toStr(raw.link_website),
      affiliateNetwork: toStr(raw.link_affiliate),
      categoryIds: [],
      eventId: null,
      description: blockToHtml(toStr(raw.description)),
      aboutStore: blockToHtml(toStr(raw.about_store)),
      howToApply: "",
      faq: [],
      isFeatured: false,
      isPin: false,
      seoTitle: "",
      seoDescription: "",
    };

    const parsed = adminStoreSchema.safeParse(candidate);
    if (!parsed.success) {
      storeErrors.push({ row, name, message: issuesToMessage(parsed.error.issues) });
      return;
    }
    validSlugs.add(slug);
    stores.push({ row, input: parsed.data });
  });

  const coupons: ParsedCouponRow[] = [];
  const couponErrors: CouponRowError[] = [];
  const couponSchemaWithoutStore = adminCouponSchema.omit({ storeId: true });

  rawCoupons.forEach((raw, index) => {
    const row = index + 2;
    const storeName = toStr(raw.store_name);
    const storeSlug = slugify(storeName);
    const title = toStr(raw.title);

    if (!attemptedSlugs.has(storeSlug)) {
      couponErrors.push({
        row,
        title,
        storeName,
        message: `Không tìm thấy store "${storeName}" trong sheet Stores.`,
      });
      return;
    }
    if (!validSlugs.has(storeSlug)) {
      couponErrors.push({
        row,
        title,
        storeName,
        message: `Store "${storeName}" bị lỗi nên coupon này cũng bị bỏ qua.`,
      });
      return;
    }

    let type = toStr(raw.type) as AdminCouponInput["type"];
    const code = toStr(raw.code);
    // Safety net mirrored from CouponForm.tsx: a brand-new coupon typed as
    // CODE with no actual code doesn't make sense.
    if (type === "CODE" && !code) type = "DEAL";

    let discountType = toStr(raw.discount_type) as AdminCouponInput["discountType"];
    let discountValue: number;

    if (type === "FREESHIP") {
      // FREESHIP coupons don't carry a meaningful discount value (mirrors
      // the useEffect in CouponForm.tsx) — force a valid combo regardless
      // of whatever the sheet says.
      discountType = "OTHER";
      discountValue = 0;
    } else {
      const rawDiscountValue = toStr(raw.discount_value);
      if (!rawDiscountValue) {
        couponErrors.push({
          row,
          title,
          storeName,
          message: "discount_value không được để trống (trừ coupon FREESHIP).",
        });
        return;
      }
      // Number("") is 0, not NaN — the blank check above must run first or
      // a blank cell would silently become "0% off" instead of an error.
      discountValue = Number(rawDiscountValue);
      if (Number.isNaN(discountValue)) {
        couponErrors.push({
          row,
          title,
          storeName,
          message: `discount_value "${rawDiscountValue}" không phải là số.`,
        });
        return;
      }
    }

    const candidate: Omit<AdminCouponInput, "storeId"> = {
      slug: `${storeSlug}-${randomCode()}`,
      title,
      description: "",
      type,
      code,
      discountType,
      discountValue,
      currency: toStr(raw.currency) || "$",
      affiliateUrl: toStr(raw.link_affiliate),
      exclusive: toStr(raw.exclusive).toUpperCase() === "TRUE",
      verified: true,
      terms: "",
      startsAt: "",
      expiresAt: "",
      isFeatured: false,
    };

    const parsed = couponSchemaWithoutStore.safeParse(candidate);
    if (!parsed.success) {
      couponErrors.push({ row, title, storeName, message: issuesToMessage(parsed.error.issues) });
      return;
    }

    coupons.push({ row, storeName, storeSlug, input: parsed.data });
  });

  const reviewNotes: ReviewNote[] = rawReview.map((raw) => ({
    row: toStr(raw.row),
    store: toStr(raw.store),
    issue: toStr(raw.issue),
  }));

  return { stores, storeErrors, coupons, couponErrors, reviewNotes };
}
