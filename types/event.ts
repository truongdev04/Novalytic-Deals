export interface Event {
  id: string;
  slug: string;
  name: string;
  iconName?: string;
  iconImageUrl?: string;
  description: string;
  bannerUrl?: string;
  startsAt?: string;
  endsAt?: string;
  featuredStoreIds: string[];
  featuredCouponIds: string[];
  // Ordered, randomized coupon ids shown in the public "Curated deals"
  // section — managed only by the admin randomize action + store-leave
  // backfill, never by adding stores to the event.
  curatedCouponIds: string[];
  createdAt: string;
}
