import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "sonner";
import { ViewTransitions } from "next-view-transitions";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BackToTop } from "@/components/ui/BackToTop";
import { AnalyticsScripts } from "@/components/analytics/AnalyticsScripts";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "@/lib/seo/JsonLdScript";
import {
  getGeneralSettings,
  getSeoSettings,
  getEffectiveGoogleSiteVerification,
  getEffectiveBingSiteVerification,
} from "@/lib/data";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://novalyticdeals.com";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const [settings, seo, googleSiteVerification, bingSiteVerification] = await Promise.all([
    getGeneralSettings(),
    getSeoSettings(),
    getEffectiveGoogleSiteVerification(),
    getEffectiveBingSiteVerification(),
  ]);
  const fallbackDescription =
    "Save more with verified coupon codes, exclusive deals, and cashback offers from thousands of trusted brands across the US & Europe.";
  const description = settings.description || seo.defaultMetaDescription || fallbackDescription;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: settings.title || "NovalyticDeals — Verified Coupon Codes & Exclusive Deals",
      template: seo.titleTemplate || "%s | NovalyticDeals",
    },
    description,
    keywords: seo.defaultKeywords || undefined,
    icons: settings.faviconUrl ? { icon: settings.faviconUrl } : undefined,
    openGraph: {
      type: "website",
      siteName: "NovalyticDeals",
      title: settings.title || "NovalyticDeals — Verified Coupon Codes & Exclusive Deals",
      description,
      images: settings.ogImage ? [{ url: settings.ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
    },
    verification: {
      google: googleSiteVerification,
      other: bingSiteVerification ? { "msvalidate.01": bingSiteVerification } : undefined,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ViewTransitions>
      <html
        lang="en"
        className={`${inter.variable} ${poppins.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-surface-50 text-foreground">
          <NextTopLoader color="var(--brand-500)" height={3} showSpinner={false} />
          <JsonLd data={await organizationJsonLd()} />
          <JsonLd data={await websiteJsonLd()} />
          <SiteChrome header={<Header />} footer={<Footer />} backToTop={<BackToTop />}>
            {children}
          </SiteChrome>
          <Toaster position="bottom-right" richColors />
          <AnalyticsScripts />
          <SpeedInsights />
        </body>
      </html>
    </ViewTransitions>
  );
}
