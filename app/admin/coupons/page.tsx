import Link from "next/link";
import { Plus } from "lucide-react";
import { getAllCoupons, getAllStores } from "@/lib/data";
import { CouponTable } from "@/components/admin/CouponTable";

export default async function AdminCouponsPage() {
  const [coupons, stores] = await Promise.all([getAllCoupons(), getAllStores()]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-950">Coupons</h1>
          <p className="mt-1 text-sm text-muted-500">{coupons.length} coupons.</p>
        </div>
        <Link
          href="/admin/coupons/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Add Coupon
        </Link>
      </div>

      <div className="mt-6">
        <CouponTable coupons={coupons} stores={stores} />
      </div>
    </div>
  );
}
