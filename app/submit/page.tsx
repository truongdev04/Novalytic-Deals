import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { SubmitCouponForm } from "@/components/forms/SubmitCouponForm";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Submit a Coupon",
  description: "Found a great deal? Submit a coupon code and help other shoppers save.",
  path: "/submit",
});

export default function SubmitCouponPage() {
  return (
    <Container className="max-w-2xl py-10">
      <Breadcrumb items={[{ name: "Submit a Coupon", path: "/submit" }]} />

      <div className="mt-6">
        <h1 className="font-heading text-3xl font-bold text-brand-950">Submit a coupon</h1>
        <p className="mt-3 text-muted-600">
          Found a great deal? Share it with the community. Our team reviews every submission
          before it goes live.
        </p>
      </div>

      <div className="mt-8 rounded-xl border border-muted-200 bg-surface-0 p-6 shadow-sm">
        <SubmitCouponForm />
      </div>
    </Container>
  );
}
