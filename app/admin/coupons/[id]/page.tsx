import { notFound } from "next/navigation";
import { auth } from "@/auth";
import {
  getAllStores,
  getCouponById,
  getCouponOwnerId,
  getContentConfigSettings,
} from "@/lib/data";
import { CouponForm } from "@/components/admin/CouponForm";
import { isDataScoped } from "@/lib/permissions";

export default async function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const scoped = isDataScoped(session?.user?.role, session?.user?.fullDataAccess, "coupons");
  const [coupon, ownerId, stores, contentConfig] = await Promise.all([
    getCouponById(id),
    scoped ? getCouponOwnerId(id) : Promise.resolve(undefined),
    getAllStores(),
    getContentConfigSettings(),
  ]);
  if (!coupon) notFound();
  if (scoped && ownerId !== session?.user?.id) notFound();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">Edit coupon</h1>
      <div className="mt-6">
        <CouponForm coupon={coupon} stores={stores} templates={contentConfig.templates} />
      </div>
    </div>
  );
}
