import Link from "next/link";
import { Tag } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Newsletter } from "@/components/ui/Newsletter";
import { getGeneralSettings } from "@/lib/data";
import {
  FacebookIcon,
  InstagramIcon,
  TwitterIcon,
  YoutubeIcon,
} from "@/components/ui/SocialIcons";

const companyLinks = [
  { name: "About Us", href: "/about" },
  { name: "Contact Us", href: "/contact" },
  { name: "Submit a Coupon", href: "/submit" },
  { name: "Blog", href: "/blog" },
];

const noticeLinks = [
  { name: "Terms Of Use", href: "/terms" },
  { name: "Privacy Policy", href: "/privacy" },
];

const quickLinks = [
  { name: "Stores", href: "/stores" },
  { name: "Categories", href: "/categories" },
  { name: "Deals", href: "/deals" },
];

export async function Footer() {
  const settings = await getGeneralSettings();

  return (
    <footer className="bg-brand-950 text-brand-100">
      <Container className="grid grid-cols-2 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="col-span-2 lg:col-span-1">
          <Link href="/" className="flex items-center gap-2">
            {settings.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin-configured logo can be any external URL, outside next/image's remotePatterns allowlist
              <img
                src={settings.logoUrl}
                alt={settings.title}
                className="h-9 w-9 rounded-lg object-contain"
              />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
                <Tag className="h-5 w-5" />
              </span>
            )}
            <span className="font-heading text-lg font-semibold text-white">
              {settings.title || "NovalyticDeals"}
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm text-brand-200">
            Your trusted source for verified coupon codes and exclusive deals from
            thousands of top brands.
          </p>
          <div className="mt-5 flex items-center gap-3">
            {[
              { Icon: FacebookIcon, name: "Facebook" },
              { Icon: TwitterIcon, name: "Twitter" },
              { Icon: InstagramIcon, name: "Instagram" },
              { Icon: YoutubeIcon, name: "YouTube" },
            ].map(({ Icon, name }) => (
              <a
                key={name}
                href="#"
                aria-label={`Follow us on ${name}`}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-brand-100 hover:bg-white/20"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-heading text-sm font-semibold text-white">Quick links</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-brand-200 hover:text-white">
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-heading text-sm font-semibold text-white">Company</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {companyLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-brand-200 hover:text-white">
                  {link.name}
                </Link>
              </li>
            ))}
            {noticeLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-brand-200 hover:text-white">
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="col-span-2 lg:col-span-1">
          <h3 className="font-heading text-sm font-semibold text-white">Newsletter</h3>
          <p className="mt-4 text-sm text-brand-200">
            Get the latest deals delivered to your inbox.
          </p>
          <div className="mt-4">
            <Newsletter variant="footer" />
          </div>
        </div>
      </Container>

      <div className="border-t border-white/10 py-6">
        <Container>
          <p className="text-center text-xs text-brand-300">
            © {new Date().getFullYear()} NovalyticDeals. All rights reserved.
          </p>
        </Container>
      </div>
    </footer>
  );
}
