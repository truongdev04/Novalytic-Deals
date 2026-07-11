import { unstable_cache } from "next/cache";
import { purgeTag } from "@/lib/server/cache/purgeTag";
import { prisma, Prisma } from "@/lib/server/db";
import type {
  AffiliateSettings,
  ContentConfigSettings,
  FooterColumn,
  FooterItem,
  FooterSettings,
  GeneralSettings,
  IntegrationsSettingsView,
  SeoSettings,
  SocialSettings,
} from "@/types";
import type { AdminIntegrationsSettingsInput } from "@/lib/validators/admin/settings";

const GENERAL_KEY = "site_meta";
const INTEGRATIONS_KEY = "integrations";
const AFFILIATE_KEY = "affiliate_defaults";
const SOCIAL_KEY = "social_links";
const SEO_KEY = "seo_defaults";
const CONTENT_CONFIG_KEY = "content_config";
const FOOTER_KEY = "footer_links";

const DEFAULT_CONTENT_CONFIG_SETTINGS: ContentConfigSettings = {
  pagination: {
    dealsPageSize: 9,
    searchPageSize: 9,
    featuredStoresCount: 8,
    featuredCategoriesCount: 8,
    trendingDealsCount: 3,
    featuredBlogCount: 3,
  },
  templates: {},
};

const ABOUT_PAGE_DESCRIPTION = `<p>NovalyticDeals is a coupon and deals platform built to help shoppers across the US and Europe save money with confidence. We test every code before it goes live, track expiration dates closely, and highlight the offers that give you the most value.</p>
<p>Our team partners with thousands of retailers to bring you exclusive discounts, cashback offers, and seasonal sales — all in one place, updated daily.</p>
<h2>Verified first</h2>
<p>Every coupon on our site is checked by hand before it's published.</p>
<h2>Curated deals</h2>
<p>We focus on quality over quantity, surfacing the offers actually worth your time.</p>
<h2>Built for shoppers</h2>
<p>Our tools are designed around real shopping habits across the US and Europe.</p>`;

const TERMS_PAGE_DESCRIPTION = `<h2>Acceptance of terms</h2>
<p>By accessing or using NovalyticDeals, you agree to be bound by these Terms of Service. If you do not agree, please do not use the site.</p>
<h2>Use of coupons and deals</h2>
<p>Coupons and deals listed on this site are provided by third-party retailers. While we verify codes regularly, we cannot guarantee that every code will work at the time you attempt to use it. Discount terms, exclusions, and expiration dates are set by the retailer, not NovalyticDeals.</p>
<h2>Affiliate links</h2>
<p>Some links on this site are affiliate links. We may receive a commission when you make a purchase through these links, at no extra cost to you. This does not influence which deals we choose to feature.</p>
<h2>User submissions</h2>
<p>By submitting a coupon or review, you grant NovalyticDeals a non-exclusive license to publish and display the content. We reserve the right to reject or remove any submission that is inaccurate, spam, or violates these terms.</p>
<h2>Limitation of liability</h2>
<p>NovalyticDeals is not responsible for any loss or damage resulting from the use of coupons, deals, or third-party websites linked from this site.</p>
<h2>Changes to these terms</h2>
<p>We may update these terms from time to time. Continued use of the site after changes are posted constitutes acceptance of the revised terms.</p>`;

const PRIVACY_PAGE_DESCRIPTION = `<h2>Information we collect</h2>
<p>We collect information you provide directly, such as your email address when subscribing to our newsletter or submitting a coupon, along with usage data like pages visited and coupons clicked, collected automatically through cookies and analytics tools.</p>
<h2>How we use your information</h2>
<p>We use collected information to operate and improve the site, send newsletter updates you've opted into, moderate user-submitted coupons, and measure the performance of deals and stores.</p>
<h2>Cookies</h2>
<p>We use cookies for essential site functionality, analytics, and to remember your preferences. You can control cookies through your browser settings at any time.</p>
<h2>Affiliate disclosure</h2>
<p>NovalyticDeals participates in affiliate marketing programs. We may earn a commission when you click through to a retailer and make a purchase, at no additional cost to you.</p>
<h2>Data sharing</h2>
<p>We do not sell your personal information. We may share limited data with service providers who help us operate the site, such as email delivery and analytics providers, under strict confidentiality agreements.</p>
<h2>Your rights</h2>
<p>You may request access to, correction of, or deletion of your personal data at any time by contacting us. EU residents have additional rights under GDPR, and California residents have rights under the CCPA.</p>`;

const DEFAULT_FOOTER_SETTINGS: FooterSettings = {
  columns: [
    {
      title: "Quick links",
      type: "PATH",
      isVisible: true,
      items: [
        { itemId: "seed-stores", name: "Stores", path: "/stores", isVisible: true },
        { itemId: "seed-categories", name: "Categories", path: "/categories", isVisible: true },
        { itemId: "seed-deals", name: "Deals", path: "/deals", isVisible: true },
      ],
    },
    {
      title: "Company",
      type: "PATH",
      isVisible: true,
      items: [
        { itemId: "seed-contact", name: "Contact Us", path: "/contact", isVisible: true },
        { itemId: "seed-submit", name: "Submit a Coupon", path: "/submit", isVisible: true },
        { itemId: "seed-blog", name: "Blog", path: "/blog", isVisible: true },
      ],
    },
    {
      title: "Legal",
      type: "PAGE",
      isVisible: true,
      items: [
        {
          itemId: "seed-about",
          name: "About Us",
          title: "About NovalyticDeals",
          slug: "about",
          description: ABOUT_PAGE_DESCRIPTION,
          isVisible: true,
        },
        {
          itemId: "seed-terms",
          name: "Terms Of Use",
          title: "Terms of Service",
          slug: "terms",
          description: TERMS_PAGE_DESCRIPTION,
          isVisible: true,
        },
        {
          itemId: "seed-privacy",
          name: "Privacy Policy",
          title: "Privacy Policy",
          slug: "privacy",
          description: PRIVACY_PAGE_DESCRIPTION,
          isVisible: true,
        },
      ],
    },
  ],
};

const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  title: "NovalyticDeals",
  description: "Verified coupons and deals for the US & Europe.",
  logoUrl: "",
  faviconUrl: "",
  ogImage: "",
  robotsIndexingEnabled: true,
  sitemapEnabled: true,
  slogan: "",
  topDescription: "",
  bottomDescription: "",
  companyName: "",
  hotline: "",
  address: "",
  email: "",
  copyright: "",
  contactIntro:
    "Have a question about a coupon, a store, or a partnership? Send us a message and our team will get back to you shortly.",
};

// Raw persistence shape for integrations — never sent to the client as-is.
interface IntegrationsRaw {
  resendApiKey?: string;
  contactInboxEmail?: string;
  turnstileSecretKey?: string;
  gaId?: string;
  gtmId?: string;
  plausibleDomain?: string;
  googleSiteVerification?: string;
  bingSiteVerification?: string;
}

async function getIntegrationsRaw(): Promise<IntegrationsRaw> {
  return unstable_cache(
    async () => {
      const row = await prisma.siteSetting.findUnique({ where: { key: INTEGRATIONS_KEY } });
      return (row?.value as unknown as IntegrationsRaw) ?? {};
    },
    ["settings:integrations:raw"],
    { tags: ["settings:integrations"], revalidate: 300 }
  )();
}

export const getGeneralSettings = unstable_cache(
  async (): Promise<GeneralSettings> => {
    const row = await prisma.siteSetting.findUnique({ where: { key: GENERAL_KEY } });
    const stored = (row?.value as unknown as Partial<GeneralSettings>) ?? {};
    return { ...DEFAULT_GENERAL_SETTINGS, ...stored };
  },
  ["settings:general"],
  { tags: ["settings:general"], revalidate: 300 }
);

export async function setGeneralSettings(input: GeneralSettings): Promise<GeneralSettings> {
  const row = await prisma.siteSetting.upsert({
    where: { key: GENERAL_KEY },
    create: { key: GENERAL_KEY, value: input as unknown as Prisma.InputJsonValue },
    update: { value: input as unknown as Prisma.InputJsonValue },
  });
  purgeTag("settings:general");
  return row.value as unknown as GeneralSettings;
}

function maskSecret(value?: string): string | undefined {
  if (!value) return undefined;
  return `••••${value.slice(-4)}`;
}

export async function getIntegrationsSettingsView(): Promise<IntegrationsSettingsView> {
  const raw = await getIntegrationsRaw();

  const resendConfigured = Boolean(raw.resendApiKey || process.env.RESEND_API_KEY);
  const turnstileConfigured = Boolean(raw.turnstileSecretKey || process.env.TURNSTILE_SECRET_KEY);

  return {
    resendApiKey: {
      configured: resendConfigured,
      source: raw.resendApiKey ? "db" : process.env.RESEND_API_KEY ? "env" : "none",
      maskedPreview: maskSecret(raw.resendApiKey),
    },
    contactInboxEmail: raw.contactInboxEmail ?? "",
    turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "",
    turnstileSiteKeySource: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? "env" : "none",
    turnstileSecretKey: {
      configured: turnstileConfigured,
      source: raw.turnstileSecretKey ? "db" : process.env.TURNSTILE_SECRET_KEY ? "env" : "none",
      maskedPreview: maskSecret(raw.turnstileSecretKey),
    },
    gaId: raw.gaId ?? "",
    gtmId: raw.gtmId ?? "",
    plausibleDomain: raw.plausibleDomain ?? "",
    googleSiteVerification: raw.googleSiteVerification ?? "",
    bingSiteVerification: raw.bingSiteVerification ?? "",
  };
}

export async function setIntegrationsSettings(
  patch: AdminIntegrationsSettingsInput
): Promise<IntegrationsSettingsView> {
  const current = await getIntegrationsRaw();
  const next: IntegrationsRaw = { ...current };

  // Non-secret fields: "" clears (falls back to env), value sets it.
  if (patch.contactInboxEmail !== undefined) {
    next.contactInboxEmail = patch.contactInboxEmail || undefined;
  }
  if (patch.gaId !== undefined) {
    next.gaId = patch.gaId || undefined;
  }
  if (patch.gtmId !== undefined) {
    next.gtmId = patch.gtmId || undefined;
  }
  if (patch.plausibleDomain !== undefined) {
    next.plausibleDomain = patch.plausibleDomain || undefined;
  }
  if (patch.googleSiteVerification !== undefined) {
    next.googleSiteVerification = patch.googleSiteVerification || undefined;
  }
  if (patch.bingSiteVerification !== undefined) {
    next.bingSiteVerification = patch.bingSiteVerification || undefined;
  }

  // Secret fields: blank/omitted = leave unchanged. Only clearFields nulls one out.
  if (patch.resendApiKey) {
    next.resendApiKey = patch.resendApiKey;
  }
  if (patch.turnstileSecretKey) {
    next.turnstileSecretKey = patch.turnstileSecretKey;
  }
  for (const field of patch.clearFields ?? []) {
    delete next[field];
  }

  await prisma.siteSetting.upsert({
    where: { key: INTEGRATIONS_KEY },
    create: { key: INTEGRATIONS_KEY, value: next as unknown as Prisma.InputJsonValue },
    update: { value: next as unknown as Prisma.InputJsonValue },
  });
  purgeTag("settings:integrations");

  return getIntegrationsSettingsView();
}

export async function getEffectiveResendConfig(): Promise<{ apiKey?: string; fromEmail?: string }> {
  const raw = await getIntegrationsRaw();
  return {
    apiKey: raw.resendApiKey || process.env.RESEND_API_KEY,
    fromEmail: raw.contactInboxEmail || process.env.CONTACT_INBOX_EMAIL,
  };
}

export async function getEffectiveTurnstileConfig(): Promise<{ secretKey?: string }> {
  const raw = await getIntegrationsRaw();
  return { secretKey: raw.turnstileSecretKey || process.env.TURNSTILE_SECRET_KEY };
}

export async function getEffectiveAnalyticsConfig(): Promise<{
  gaId?: string;
  gtmId?: string;
  plausibleDomain?: string;
}> {
  const raw = await getIntegrationsRaw();
  return {
    gaId: raw.gaId || process.env.NEXT_PUBLIC_GA_ID,
    gtmId: raw.gtmId,
    plausibleDomain: raw.plausibleDomain || process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
  };
}

export async function getEffectiveGoogleSiteVerification(): Promise<string | undefined> {
  const raw = await getIntegrationsRaw();
  return raw.googleSiteVerification || undefined;
}

export async function getEffectiveBingSiteVerification(): Promise<string | undefined> {
  const raw = await getIntegrationsRaw();
  return raw.bingSiteVerification || undefined;
}

export const getAffiliateSettings = unstable_cache(
  async (): Promise<AffiliateSettings> => {
    const row = await prisma.siteSetting.findUnique({ where: { key: AFFILIATE_KEY } });
    return (row?.value as unknown as AffiliateSettings) ?? {};
  },
  ["settings:affiliate"],
  { tags: ["settings:affiliate"], revalidate: 300 }
);

export async function setAffiliateSettings(input: AffiliateSettings): Promise<AffiliateSettings> {
  const row = await prisma.siteSetting.upsert({
    where: { key: AFFILIATE_KEY },
    create: { key: AFFILIATE_KEY, value: input as unknown as Prisma.InputJsonValue },
    update: { value: input as unknown as Prisma.InputJsonValue },
  });
  purgeTag("settings:affiliate");
  return row.value as unknown as AffiliateSettings;
}

export async function getEffectiveDefaultAffiliateNetwork(): Promise<string | undefined> {
  const settings = await getAffiliateSettings();
  return settings.defaultAffiliateNetwork || process.env.AFFILIATE_DEFAULT_NETWORK;
}

export const getSocialSettings = unstable_cache(
  async (): Promise<SocialSettings> => {
    const row = await prisma.siteSetting.findUnique({ where: { key: SOCIAL_KEY } });
    return (row?.value as unknown as SocialSettings) ?? {};
  },
  ["settings:social"],
  { tags: ["settings:social"], revalidate: 300 }
);

export async function setSocialSettings(input: SocialSettings): Promise<SocialSettings> {
  const row = await prisma.siteSetting.upsert({
    where: { key: SOCIAL_KEY },
    create: { key: SOCIAL_KEY, value: input as unknown as Prisma.InputJsonValue },
    update: { value: input as unknown as Prisma.InputJsonValue },
  });
  purgeTag("settings:social");
  return row.value as unknown as SocialSettings;
}

export const getSeoSettings = unstable_cache(
  async (): Promise<SeoSettings> => {
    const row = await prisma.siteSetting.findUnique({ where: { key: SEO_KEY } });
    return (row?.value as unknown as SeoSettings) ?? {};
  },
  ["settings:seo"],
  { tags: ["settings:seo"], revalidate: 300 }
);

export async function setSeoSettings(input: SeoSettings): Promise<SeoSettings> {
  const row = await prisma.siteSetting.upsert({
    where: { key: SEO_KEY },
    create: { key: SEO_KEY, value: input as unknown as Prisma.InputJsonValue },
    update: { value: input as unknown as Prisma.InputJsonValue },
  });
  purgeTag("settings:seo");
  return row.value as unknown as SeoSettings;
}

export const getContentConfigSettings = unstable_cache(
  async (): Promise<ContentConfigSettings> => {
    const row = await prisma.siteSetting.findUnique({ where: { key: CONTENT_CONFIG_KEY } });
    const stored = (row?.value as unknown as Partial<ContentConfigSettings>) ?? {};
    return {
      pagination: { ...DEFAULT_CONTENT_CONFIG_SETTINGS.pagination, ...stored.pagination },
      templates: { ...DEFAULT_CONTENT_CONFIG_SETTINGS.templates, ...stored.templates },
    };
  },
  ["settings:content-config"],
  { tags: ["settings:content-config"], revalidate: 300 }
);

export async function setContentConfigSettings(
  input: ContentConfigSettings
): Promise<ContentConfigSettings> {
  const row = await prisma.siteSetting.upsert({
    where: { key: CONTENT_CONFIG_KEY },
    create: { key: CONTENT_CONFIG_KEY, value: input as unknown as Prisma.InputJsonValue },
    update: { value: input as unknown as Prisma.InputJsonValue },
  });
  purgeTag("settings:content-config");
  return row.value as unknown as ContentConfigSettings;
}

// Pre-rewrite footer data used either a flat { title, links: [{label,href}] }
// shape with no `type`/`items`, or (briefly) typed columns whose items
// predate the `itemId` field — either stale shape must be treated as absent
// rather than rendered, or Footer.tsx/[slug]/the admin edit-item pages break
// on the missing fields.
function isValidFooterColumns(columns: unknown): columns is FooterColumn[] {
  return (
    Array.isArray(columns) &&
    columns.every(
      (column) =>
        column &&
        typeof column === "object" &&
        ["PAGE", "PATH", "LINK"].includes((column as FooterColumn).type) &&
        Array.isArray((column as FooterColumn).items) &&
        (column as FooterColumn).items.every(
          (item) => typeof item.itemId === "string" && item.itemId.length > 0
        )
    )
  );
}

export const getFooterSettings = unstable_cache(
  async (): Promise<FooterSettings> => {
    const row = await prisma.siteSetting.findUnique({ where: { key: FOOTER_KEY } });
    const stored = (row?.value as unknown as Partial<FooterSettings>) ?? {};
    return {
      columns: isValidFooterColumns(stored.columns) ? stored.columns : DEFAULT_FOOTER_SETTINGS.columns,
    };
  },
  ["settings:footer"],
  { tags: ["settings:footer"], revalidate: 300 }
);

export async function setFooterSettings(input: FooterSettings): Promise<FooterSettings> {
  const row = await prisma.siteSetting.upsert({
    where: { key: FOOTER_KEY },
    create: { key: FOOTER_KEY, value: input as unknown as Prisma.InputJsonValue },
    update: { value: input as unknown as Prisma.InputJsonValue },
  });
  purgeTag("settings:footer");
  return row.value as unknown as FooterSettings;
}

export async function getFooterItemById(id: string): Promise<{
  settings: FooterSettings;
  columnIndex: number;
  type: FooterColumn["type"];
  item: FooterItem;
} | null> {
  const settings = await getFooterSettings();
  for (const [columnIndex, column] of settings.columns.entries()) {
    const item = column.items.find((i) => i.itemId === id);
    if (item) return { settings, columnIndex, type: column.type, item };
  }
  return null;
}

export interface FooterPage {
  name: string;
  title: string;
  slug: string;
  description: string;
}

export async function getFooterPages(): Promise<FooterPage[]> {
  const settings = await getFooterSettings();
  return settings.columns
    .filter((column) => column.type === "PAGE" && column.isVisible)
    .flatMap((column) => column.items)
    .filter((item) => item.isVisible && item.slug && item.title && item.description)
    .map((item) => ({
      name: item.name,
      title: item.title as string,
      slug: item.slug as string,
      description: item.description as string,
    }));
}

export async function getFooterPageBySlug(slug: string): Promise<FooterPage | null> {
  const pages = await getFooterPages();
  return pages.find((page) => page.slug === slug) ?? null;
}
