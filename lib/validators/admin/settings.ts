import { z } from "zod";
import { storeFaqItemSchema } from "./store";

function optionalEmailField() {
  return z.string().email("Enter a valid email").optional().or(z.literal(""));
}

export const adminGeneralSettingsSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  logoUrl: z.string().optional().or(z.literal("")),
  faviconUrl: z.string().optional().or(z.literal("")),
  ogImage: z.string().optional().or(z.literal("")),
  robotsIndexingEnabled: z.boolean(),
  sitemapEnabled: z.boolean(),
  slogan: z.string().optional().or(z.literal("")),
  topDescription: z.string().optional().or(z.literal("")),
  bottomDescription: z.string().optional().or(z.literal("")),
  companyName: z.string().optional().or(z.literal("")),
  hotline: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  email: optionalEmailField(),
  copyright: z.string().optional().or(z.literal("")),
  contactIntro: z.string().optional().or(z.literal("")),
});
export type AdminGeneralSettingsInput = z.infer<typeof adminGeneralSettingsSchema>;

export const adminIntegrationsSettingsSchema = z.object({
  resendApiKey: z.string().optional().or(z.literal("")),
  contactInboxEmail: z.string().email("Enter a valid email").optional().or(z.literal("")),
  turnstileSecretKey: z.string().optional().or(z.literal("")),
  gaId: z.string().optional().or(z.literal("")),
  gtmId: z.string().optional().or(z.literal("")),
  plausibleDomain: z.string().optional().or(z.literal("")),
  googleSiteVerification: z.string().optional().or(z.literal("")),
  bingSiteVerification: z.string().optional().or(z.literal("")),
  clearFields: z.array(z.enum(["resendApiKey", "turnstileSecretKey"])).optional(),
});
export type AdminIntegrationsSettingsInput = z.infer<typeof adminIntegrationsSettingsSchema>;

export const adminAffiliateSettingsSchema = z.object({
  defaultAffiliateNetwork: z.string().optional().or(z.literal("")),
});
export type AdminAffiliateSettingsInput = z.infer<typeof adminAffiliateSettingsSchema>;

export const cachePurgeSchema = z.union([
  z.object({ all: z.literal(true) }),
  z.object({ tag: z.string().min(1, "Tag is required") }),
]);
export type CachePurgeInput = z.infer<typeof cachePurgeSchema>;

export const adminAuthorFieldsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  avatarUrl: z.string().optional().or(z.literal("")),
  jobTitle: z.string().optional().or(z.literal("")),
  bio: z.string().optional().or(z.literal("")),
  isDefault: z.boolean(),
});
export type AdminAuthorFieldsInput = z.infer<typeof adminAuthorFieldsSchema>;

function optionalUrlField() {
  return z
    .string()
    .refine((value) => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    }, "Enter a valid URL")
    .optional()
    .or(z.literal(""));
}

export const adminSocialSettingsSchema = z.object({
  facebookUrl: optionalUrlField(),
  tiktokUrl: optionalUrlField(),
  instagramUrl: optionalUrlField(),
  xUrl: optionalUrlField(),
  youtubeUrl: optionalUrlField(),
});
export type AdminSocialSettingsInput = z.infer<typeof adminSocialSettingsSchema>;

export const adminSeoSettingsSchema = z.object({
  titleTemplate: z.string().optional().or(z.literal("")),
  defaultMetaDescription: z.string().optional().or(z.literal("")),
  defaultKeywords: z.string().optional().or(z.literal("")),
  homepageTitle: z.string().optional().or(z.literal("")),
  homepageDescription: z.string().optional().or(z.literal("")),
});
export type AdminSeoSettingsInput = z.infer<typeof adminSeoSettingsSchema>;

export const adminContentConfigSettingsSchema = z.object({
  pagination: z.object({
    dealsPageSize: z.number().int().min(1),
    featuredStoresCount: z.number().int().min(1),
    featuredCategoriesCount: z.number().int().min(1),
    trendingDealsCount: z.number().int().min(1),
    exclusiveCodesCount: z.number().int().min(1),
    bestDealsCount: z.number().int().min(1),
    featuredBlogCount: z.number().int().min(1),
  }),
  templates: z.object({
    storeSeoTitleTemplate: z.string().optional().or(z.literal("")),
    storeSeoTitleFallbackTemplate: z.string().optional().or(z.literal("")),
    storeDescriptionTemplate: z.string().optional().or(z.literal("")),
    storeAboutTemplate: z.string().optional().or(z.literal("")),
    storeHowToApplyTemplate: z.string().optional().or(z.literal("")),
    storeFaqTemplate: z.array(storeFaqItemSchema).optional(),
    storeSeoDescriptionTemplate: z.string().optional().or(z.literal("")),
    storeSeoDescriptionFallbackTemplate: z.string().optional().or(z.literal("")),
    couponDescriptionTemplate: z.string().optional().or(z.literal("")),
    couponTermsTemplate: z.string().optional().or(z.literal("")),
    blogSeoTitleTemplate: z.string().optional().or(z.literal("")),
    blogExcerptTemplate: z.string().optional().or(z.literal("")),
    blogSeoDescriptionTemplate: z.string().optional().or(z.literal("")),
  }),
});
export type AdminContentConfigSettingsInput = z.infer<typeof adminContentConfigSettingsSchema>;

// Slugs of routes that still exist as their own static/dynamic app/ segments
// — a PAGE item can't use one of these or its /[slug] page would be
// permanently shadowed by the real route.
const RESERVED_PAGE_SLUGS = new Set([
  "admin",
  "api",
  "blog",
  "categories",
  "contact",
  "coupon",
  "deals",
  "events",
  "go",
  "newsletter",
  "search",
  "store",
  "stores",
  "submit",
]);

const adminFooterItemSchema = z.object({
  itemId: z.string().min(1),
  name: z.string().min(1, "Name is required"),
  isVisible: z.boolean(),
  path: z.string().optional().or(z.literal("")),
  link: z.string().optional().or(z.literal("")),
  title: z.string().optional().or(z.literal("")),
  slug: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
});

const adminFooterColumnSchema = z.object({
  title: z.string().min(1, "Column name is required"),
  type: z.enum(["PAGE", "PATH", "LINK"]),
  isVisible: z.boolean(),
  items: z.array(adminFooterItemSchema),
});

export const adminFooterSettingsSchema = z
  .object({
    columns: z.array(adminFooterColumnSchema).max(4, "Up to 4 columns"),
  })
  .superRefine((data, ctx) => {
    const seenSlugs = new Set<string>();
    data.columns.forEach((column, columnIndex) => {
      column.items.forEach((item, itemIndex) => {
        const basePath = ["columns", columnIndex, "items", itemIndex] as const;
        if (column.type === "PATH") {
          if (!item.path || !item.path.startsWith("/")) {
            ctx.addIssue({ code: "custom", message: "Path must start with /", path: [...basePath, "path"] });
          }
        } else if (column.type === "LINK") {
          if (!item.link || !/^https?:\/\//.test(item.link)) {
            ctx.addIssue({ code: "custom", message: "Enter a valid URL", path: [...basePath, "link"] });
          }
        } else if (column.type === "PAGE") {
          if (!item.title) {
            ctx.addIssue({ code: "custom", message: "Title is required", path: [...basePath, "title"] });
          }
          if (!item.description) {
            ctx.addIssue({
              code: "custom",
              message: "Description is required",
              path: [...basePath, "description"],
            });
          }
          if (!item.slug || !/^[a-z0-9-]+$/.test(item.slug)) {
            ctx.addIssue({
              code: "custom",
              message: "Lowercase kebab-case only",
              path: [...basePath, "slug"],
            });
          } else if (RESERVED_PAGE_SLUGS.has(item.slug)) {
            ctx.addIssue({ code: "custom", message: "This slug is reserved", path: [...basePath, "slug"] });
          } else if (seenSlugs.has(item.slug)) {
            ctx.addIssue({
              code: "custom",
              message: "Slug already used by another page",
              path: [...basePath, "slug"],
            });
          } else {
            seenSlugs.add(item.slug);
          }
        }
      });
    });
  });
export type AdminFooterSettingsInput = z.infer<typeof adminFooterSettingsSchema>;
