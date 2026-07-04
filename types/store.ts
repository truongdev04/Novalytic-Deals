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
  region: StoreRegion;
  affiliateNetwork: string;
  isFeatured: boolean;
  isActive: boolean;
  clickCount: number;
  seo: StoreSeo;
  faq: StoreFaqItem[];
  createdAt: string;
  updatedAt: string;
}
