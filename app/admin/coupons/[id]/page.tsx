import { notFound } from "next/navigation";
import { getAllStores, getCouponById, getContentConfigSettings } from "@/lib/data";
import { CouponForm } from "@/components/admin/CouponForm";

export default async function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [coupon, stores, contentConfig] = await Promise.all([
    getCouponById(id),
    getAllStores(),
    getContentConfigSettings(),
  ]);
  if (!coupon) notFound();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">Edit coupon</h1>
      <div className="mt-6">
        <CouponForm coupon={coupon} stores={stores} templates={contentConfig.templates} />
      </div>
    </div>
  );
}
