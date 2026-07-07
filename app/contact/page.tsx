import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ContactForm } from "@/components/forms/ContactForm";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Contact Us",
    description: "Get in touch with the NovalyticDeals team.",
    path: "/contact",
  });
}

export default function ContactPage() {
  return (
    <Container className="py-10">
      <Breadcrumb items={[{ name: "Contact Us", path: "/contact" }]} />

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div>
          <h1 className="font-heading text-3xl font-bold text-brand-950">Contact us</h1>
          <p className="mt-3 max-w-md text-muted-600">
            Have a question about a coupon, a store, or a partnership? Send us a message and
            our team will get back to you shortly.
          </p>
          <div className="mt-6 flex items-center gap-2 text-sm text-brand-700">
            <Mail className="h-4 w-4" />
            <span>novalytic.studio@gmail.com</span>
          </div>
        </div>

        <div className="rounded-xl border border-muted-200 bg-surface-0 p-6 shadow-sm">
          <ContactForm />
        </div>
      </div>
    </Container>
  );
}
