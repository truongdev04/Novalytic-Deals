export type CouponType = "CODE" | "DEAL" | "CASHBACK" | "FREESHIP" | "BOGO";
export type DiscountType = "PERCENT" | "AMOUNT" | "OTHER";

export interface Coupon {
  id: string;
  slug: string;
  storeId: string;
  title: string;
  description: string;
  type: CouponType;
  code?: string;
  discountType: DiscountType;
  discountValue: number;
  currency: string;
  affiliateUrl: string;
  exclusive: boolean;
  verified: boolean;
  verifiedAt?: string;
  terms: string;
  startsAt: string;
  expiresAt?: string;
  usageCount: number;
  upvotes: number;
  downvotes: number;
  isFeatured: boolean;
  isTrending: boolean;
  createdAt: string;
  updatedAt: string;
}
