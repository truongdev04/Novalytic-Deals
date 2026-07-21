import {
  getCouponsAdminPaginated,
  getAllStores,
  getCouponRefreshSettings,
  type AdminCouponFilters,
} from "@/lib/data";
import { CouponTable } from "@/components/admin/CouponTable";
import { CouponControls } from "@/components/admin/CouponControls";
import { PAGE_SIZE_OPTIONS } from "@/lib/constants/admin";
import type { Coupon } from "@/types";

function parseBool(value?: string): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

const COUPON_TYPES: Coupon["type"][] = ["CODE", "DEAL", "FREESHIP"];

function parseType(value?: string): Coupon["type"] | undefined {
  return COUPON_TYPES.includes(value as Coupon["type"]) ? (value as Coupon["type"]) : undefined;
}

export default async function AdminCouponsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    store?: string;
    type?: string;
    featured?: string;
    status?: string;
    verified?: string;
    exclusive?: string;
    page?: string;
    size?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = PAGE_SIZE_OPTIONS.includes(Number(params.size)) ? Number(params.size) : 20;

  const filters: AdminCouponFilters = {
    storeId: params.store || undefined,
    type: parseType(params.type),
    query: params.q || undefined,
    isFeatured: parseBool(params.featured),
    isActive: params.status === "active" ? true : params.status === "hidden" ? false : undefined,
    verified: parseBool(params.verified),
    exclusive: parseBool(params.exclusive),
  };

  const [{ items: coupons, total }, stores, couponRefreshSettings] = await Promise.all([
    getCouponsAdminPaginated(filters, page, pageSize),
    getAllStores(),
    getCouponRefreshSettings(),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-950">Coupons</h1>
          <p className="mt-1 text-sm text-muted-500">{total} coupons.</p>
        </div>
        <CouponControls
          initialAutoCouponEnabled={couponRefreshSettings.autoCouponEnabled}
          initialLastRefreshedAt={couponRefreshSettings.lastRefreshedAt}
        />
      </div>

      <div className="mt-6">
        <CouponTable coupons={coupons} stores={stores} total={total} page={page} pageSize={pageSize} />
      </div>
    </div>
  );
}
