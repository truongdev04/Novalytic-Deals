export type DealType = "DEAL" | "CODE";

export interface Deal {
  id: string;
  slug: string;
  storeId: string;
  name: string;
  type: DealType;
  code?: string;
  eventId: string | null;
  categoryId: string | null;
  originalPrice?: number;
  price: number;
  offer?: string;
  url: string;
  imageUrl: string;
  description?: string;
  isFeatured: boolean;
  isActive: boolean;
  /** Rolling 8-hour click counters — see lib/content/dealsRefresh.ts. Not admin-editable. */
  currentHourClicks: number;
  lastHourClicks: number;
  createdAt: string;
  updatedAt: string;
}
