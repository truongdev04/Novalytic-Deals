import type { Metadata } from "next";
import { ShieldCheck, Sparkles, Users } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "About Us",
    description: "Learn more about NovalyticDeals and our mission to help you save more.",
    path: "/about",
  });
}

const values = [
  {
    title: "Verified first",
    description: "Every coupon on our site is checked by hand before it's published.",
    icon: ShieldCheck,
  },
  {
    title: "Curated deals",
    description: "We focus on quality over quantity, surfacing the offers actually worth your time.",
    icon: Sparkles,
  },
  {
    title: "Built for shoppers",
    description: "Our tools are designed around real shopping habits across the US and Europe.",
    icon: Users,
  },
];

export default function AboutPage() {
  return (
    <Container className="py-10">
      <Breadcrumb items={[{ name: "About Us", path: "/about" }]} />

      <div className="mt-4 max-w-2xl">
        <h1 className="font-heading text-3xl font-bold text-brand-950">About NovalyticDeals</h1>
        <p className="mt-4 text-muted-600">
          NovalyticDeals is a coupon and deals platform built to help shoppers across the US and
          Europe save money with confidence. We test every code before it goes live, track
          expiration dates closely, and highlight the offers that give you the most value.
        </p>
        <p className="mt-4 text-muted-600">
          Our team partners with thousands of retailers to bring you exclusive discounts,
          cashback offers, and seasonal sales — all in one place, updated daily.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {values.map((value) => (
          <div
            key={value.title}
            className="rounded-lg border border-muted-200 bg-surface-0 p-6 shadow-sm"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <value.icon className="h-5 w-5" />
            </span>
            <h2 className="mt-3 font-heading font-semibold text-brand-950">{value.title}</h2>
            <p className="mt-1 text-sm text-muted-600">{value.description}</p>
          </div>
        ))}
      </div>
    </Container>
  );
}
