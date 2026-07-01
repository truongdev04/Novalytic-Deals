import { RefreshCw, ShieldCheck, Users, Zap } from "lucide-react";
import { SectionHeader } from "@/components/layout/SectionHeader";

const reasons = [
  {
    title: "Verified codes",
    description: "Every code is tested before it's published on the site.",
    icon: ShieldCheck,
  },
  {
    title: "Instant savings",
    description: "Apply codes at checkout and see the discount right away.",
    icon: Zap,
  },
  {
    title: "Updated daily",
    description: "Our team refreshes deals and expiration dates every day.",
    icon: RefreshCw,
  },
  {
    title: "Trusted by thousands",
    description: "Shoppers across the US and Europe rely on us to save more.",
    icon: Users,
  },
];

export function WhyTrustUs() {
  return (
    <section>
      <SectionHeader
        title="Why trust us"
        subtitle="We're committed to helping you save money with confidence"
      />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {reasons.map((reason) => (
          <div
            key={reason.title}
            className="flex flex-col items-center rounded-lg border border-muted-200 bg-surface-0 p-6 text-center shadow-sm"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <reason.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-3 font-heading font-semibold text-brand-950">{reason.title}</h3>
            <p className="mt-1 text-sm text-muted-600">{reason.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
