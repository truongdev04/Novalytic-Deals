import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Terms of Service",
  description: "The terms and conditions for using NovalyticDeals.",
  path: "/terms",
});

const sections = [
  {
    title: "Acceptance of terms",
    body: "By accessing or using NovalyticDeals, you agree to be bound by these Terms of Service. If you do not agree, please do not use the site.",
  },
  {
    title: "Use of coupons and deals",
    body: "Coupons and deals listed on this site are provided by third-party retailers. While we verify codes regularly, we cannot guarantee that every code will work at the time you attempt to use it. Discount terms, exclusions, and expiration dates are set by the retailer, not NovalyticDeals.",
  },
  {
    title: "Affiliate links",
    body: "Some links on this site are affiliate links. We may receive a commission when you make a purchase through these links, at no extra cost to you. This does not influence which deals we choose to feature.",
  },
  {
    title: "User submissions",
    body: "By submitting a coupon or review, you grant NovalyticDeals a non-exclusive license to publish and display the content. We reserve the right to reject or remove any submission that is inaccurate, spam, or violates these terms.",
  },
  {
    title: "Limitation of liability",
    body: "NovalyticDeals is not responsible for any loss or damage resulting from the use of coupons, deals, or third-party websites linked from this site.",
  },
  {
    title: "Changes to these terms",
    body: "We may update these terms from time to time. Continued use of the site after changes are posted constitutes acceptance of the revised terms.",
  },
];

export default function TermsPage() {
  return (
    <Container className="max-w-3xl py-10">
      <Breadcrumb items={[{ name: "Terms Of Use", path: "/terms" }]} />

      <h1 className="mt-4 font-heading text-3xl font-bold text-brand-950">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-500">Last updated: January 1, 2026</p>

      <div className="mt-8 space-y-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="font-heading text-lg font-semibold text-brand-950">{section.title}</h2>
            <p className="mt-2 leading-relaxed text-muted-600">{section.body}</p>
          </section>
        ))}
      </div>
    </Container>
  );
}
