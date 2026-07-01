import { CopyCheck, Search, Wallet } from "lucide-react";
import { SectionHeader } from "@/components/layout/SectionHeader";

const steps = [
  {
    number: 1,
    title: "Search for deals",
    description: "Browse thousands of verified coupons from your favorite brands.",
    icon: Search,
  },
  {
    number: 2,
    title: "Copy the code",
    description: "Reveal and copy the code to your clipboard in one click.",
    icon: CopyCheck,
  },
  {
    number: 3,
    title: "Save money",
    description: "Apply the code at checkout and enjoy instant savings.",
    icon: Wallet,
  },
];

export function HowItWorks() {
  return (
    <section>
      <SectionHeader title="How it works" subtitle="Start saving in three simple steps" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {steps.map((step) => (
          <div
            key={step.number}
            className="flex flex-col items-center rounded-lg border border-muted-200 bg-surface-0 p-6 text-center shadow-sm"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 font-heading text-lg font-bold text-white">
              {step.number}
            </span>
            <step.icon className="mt-4 h-6 w-6 text-brand-600" />
            <h3 className="mt-3 font-heading font-semibold text-brand-950">{step.title}</h3>
            <p className="mt-1 text-sm text-muted-600">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
