import type { Metadata } from "next";
import { Link } from "next-view-transitions";
import { CheckCircle2 } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Subscription confirmed",
    description: "Your NovalyticDeals newsletter subscription is confirmed.",
    path: "/newsletter/confirmed",
  });
}

export default function NewsletterConfirmedPage() {
  return (
    <Container className="flex max-w-lg flex-col items-center py-20 text-center">
      <CheckCircle2 className="h-12 w-12 text-brand-600" />
      <h1 className="mt-4 font-heading text-2xl font-bold text-brand-950">
        Subscription confirmed
      </h1>
      <p className="mt-2 text-muted-600">
        You&apos;re all set — we&apos;ll send the best deals straight to your inbox.
      </p>
      <Button asChild className="mt-6 rounded-xl">
        <Link href="/">Back to home</Link>
      </Button>
    </Container>
  );
}
