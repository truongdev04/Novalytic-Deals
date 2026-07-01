export interface Event {
  id: string;
  slug: string;
  name: string;
  iconName: string;
  description: string;
  bannerUrl?: string;
  startsAt: string;
  endsAt: string;
  featuredStoreIds: string[];
  featuredCouponIds: string[];
}
