export type StoreRegion = "US" | "EU" | "GLOBAL";

export interface StoreFaqItem {
  question: string;
  answer: string;
}

export interface StoreSeo {
  title: string;
  description: string;
}

export interface Store {
  id: string;
  slug: string;
  name: string;
  logoUrl: string;
  bannerUrl?: string;
  website: string;
  description: string;
  aboutStore: string;
  howToApply?: string;
  rating: number;
  ratingCount: number;
  categoryIds: string[];
  eventId?: string | null;
  region: StoreRegion;
  affiliateNetwork: string;
  isFeatured: boolean;
  /** Only takes effect combined with isFeatured=true — see getFeaturedStores(). */
  isPin: boolean;
  isActive: boolean;
  /** Rolling monthly click counters driving Popular Stores ranking — see lib/content/popularStoresRefresh.ts. */
  currentMonthClicks: number;
  lastMonthClicks: number;
  seo: StoreSeo;
  faq: StoreFaqItem[];
  /** Monthly-frozen SEO discount snapshot — see lib/content/storeSeoSnapshot.ts. Not admin-editable. */
  seoDiscountSnapshot?: string | null;
  seoDiscountSnapshotPeriod?: string | null;
  createdAt: string;
  updatedAt: string;
}
