import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Privacy Policy",
    description: "How NovalyticDeals collects, uses, and protects your information.",
    path: "/privacy",
  });
}

const sections = [
  {
    title: "Information we collect",
    body: "We collect information you provide directly, such as your email address when subscribing to our newsletter or submitting a coupon, along with usage data like pages visited and coupons clicked, collected automatically through cookies and analytics tools.",
  },
  {
    title: "How we use your information",
    body: "We use collected information to operate and improve the site, send newsletter updates you've opted into, moderate user-submitted coupons, and measure the performance of deals and stores.",
  },
  {
    title: "Cookies",
    body: "We use cookies for essential site functionality, analytics, and to remember your preferences. You can control cookies through your browser settings at any time.",
  },
  {
    title: "Affiliate disclosure",
    body: "NovalyticDeals participates in affiliate marketing programs. We may earn a commission when you click through to a retailer and make a purchase, at no additional cost to you.",
  },
  {
    title: "Data sharing",
    body: "We do not sell your personal information. We may share limited data with service providers who help us operate the site, such as email delivery and analytics providers, under strict confidentiality agreements.",
  },
  {
    title: "Your rights",
    body: "You may request access to, correction of, or deletion of your personal data at any time by contacting us. EU residents have additional rights under GDPR, and California residents have rights under the CCPA.",
  },
];

export default function PrivacyPage() {
  return (
    <Container className="max-w-3xl py-10">
      <Breadcrumb items={[{ name: "Privacy Policy", path: "/privacy" }]} />

      <h1 className="mt-4 font-heading text-3xl font-bold text-brand-950">Privacy Policy</h1>
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
