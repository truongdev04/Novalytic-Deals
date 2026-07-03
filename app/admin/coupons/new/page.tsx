import { getAllStores } from "@/lib/data";
import { CouponForm } from "@/components/admin/CouponForm";

export default async function NewCouponPage() {
  const stores = await getAllStores();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">New coupon</h1>
      <div className="mt-6">
        <CouponForm stores={stores} />
      </div>
    </div>
  );
}
