export interface GeneralSettings {
  title: string;
  description: string;
  logoUrl?: string;
  faviconUrl?: string;
  ogImage?: string;
  robotsIndexingEnabled: boolean;
  sitemapEnabled: boolean;
  slogan?: string;
  topDescription?: string;
  bottomDescription?: string;
  companyName?: string;
  hotline?: string;
  address?: string;
  email?: string;
  copyright?: string;
  contactIntro?: string;
}

export interface AffiliateSettings {
  defaultAffiliateNetwork?: string;
}

export type RedirectType = "PERMANENT" | "TEMPORARY";

export interface RedirectRule {
  id: string;
  source: string;
  destination: string;
  type: RedirectType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AdminRole = "ADMIN" | "EDITOR";

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  createdAt: string;
  updatedAt: string;
}

export type SecretFieldSource = "db" | "env" | "none";

export interface SecretFieldView {
  configured: boolean;
  source: SecretFieldSource;
  maskedPreview?: string;
}

export interface IntegrationsSettingsView {
  resendApiKey: SecretFieldView;
  contactInboxEmail?: string;
  turnstileSiteKey?: string;
  turnstileSiteKeySource: "env" | "none";
  turnstileSecretKey: SecretFieldView;
  gaId?: string;
  gtmId?: string;
  plausibleDomain?: string;
  googleSiteVerification?: string;
  bingSiteVerification?: string;
}

export interface Author {
  id: string;
  name: string;
  avatarUrl?: string;
  jobTitle?: string;
  bio?: string;
  isDefault: boolean;
}

export interface SocialSettings {
  facebookUrl?: string;
  tiktokUrl?: string;
  instagramUrl?: string;
  xUrl?: string;
  youtubeUrl?: string;
}

export interface SeoSettings {
  titleTemplate?: string;
  defaultMetaDescription?: string;
  defaultKeywords?: string;
  /** literal <title> shown for the homepage — what Google shows for a brand-name search */
  homepageTitle?: string;
  /** literal meta description for the homepage — what Google shows for a brand-name search */
  homepageDescription?: string;
}

export interface ContentConfigPagination {
  dealsPageSize: number;
  searchPageSize: number;
  featuredStoresCount: number;
  featuredCategoriesCount: number;
  trendingDealsCount: number;
  featuredBlogCount: number;
}

export interface StoreFaqTemplateItem {
  question: string;
  answer: string;
}

export interface ContentConfigTemplates {
  storeSeoTitleTemplate?: string;
  storeSeoTitleFallbackTemplate?: string;
  storeDescriptionTemplate?: string;
  storeAboutTemplate?: string;
  storeHowToApplyTemplate?: string;
  storeFaqTemplate?: StoreFaqTemplateItem[];
  storeSeoDescriptionTemplate?: string;
  storeSeoDescriptionFallbackTemplate?: string;
  couponDescriptionTemplate?: string;
  couponTermsTemplate?: string;
  blogSeoTitleTemplate?: string;
  blogExcerptTemplate?: string;
  blogSeoDescriptionTemplate?: string;
}

export interface ContentConfigSettings {
  pagination: ContentConfigPagination;
  templates: ContentConfigTemplates;
}

export type FooterColumnType = "PAGE" | "PATH" | "LINK";

export interface FooterItem {
  /**
   * Stable identity, addressable at /admin/settings/footer/items/[id].
   * Named `itemId` (not `id`) because react-hook-form's `useFieldArray`
   * reserves the `id` key for its own internal row tracking and silently
   * strips/overwrites a data field literally named `id`.
   */
  itemId: string;
  name: string;
  isVisible: boolean;
  /** type PATH — internal site path, e.g. "/valentine" */
  path?: string;
  /** type LINK — external URL, e.g. "https://..." */
  link?: string;
  /** type PAGE — page <title> / H1 */
  title?: string;
  /** type PAGE — kebab-case, unique across all PAGE items, served at /[slug] */
  slug?: string;
  /** type PAGE — rich text HTML body */
  description?: string;
}

export interface FooterColumn {
  title: string;
  type: FooterColumnType;
  isVisible: boolean;
  items: FooterItem[];
}

export interface FooterSettings {
  columns: FooterColumn[];
}
