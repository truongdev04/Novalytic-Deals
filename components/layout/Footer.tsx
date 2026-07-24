import { Link } from "next-view-transitions";
import { Mail, MapPin, Phone, Tag } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Newsletter } from "@/components/ui/Newsletter";
import { getFooterSettings, getGeneralSettings, getSocialSettings } from "@/lib/data";
import {
  FacebookIcon,
  InstagramIcon,
  TiktokIcon,
  TwitterIcon,
  YoutubeIcon,
} from "@/components/ui/SocialIcons";
import type { GeneralSettings } from "@/types";

function buildCopyright(settings: GeneralSettings): string {
  const year = String(new Date().getFullYear());
  if (settings.copyright) return settings.copyright.replaceAll("{year}", year);
  const name = (settings.companyName || settings.title || "NovalyticDeals").replace(/\.+$/, "");
  return `© ${year} ${name}. All rights reserved.`;
}

// Brand + Newsletter columns are always present; only the link columns in
// between are admin-configurable (up to 4, capped in the validator), so the
// desktop column count ranges from 3 (0 link columns) to 6 (4 link columns).
// Tailwind's JIT needs literal class strings, so this can't be a template
// literal — if an admin somehow exceeds 4 columns, the extras just wrap onto
// a second grid row (default CSS grid behavior), which is an acceptable edge
// case rather than something to special-case further.
const DESKTOP_GRID_COLS: Record<number, string> = {
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
};

export async function Footer() {
  const [settings, social, footer] = await Promise.all([
    getGeneralSettings(),
    getSocialSettings(),
    getFooterSettings(),
  ]);
  const socialLinks = [
    { Icon: FacebookIcon, name: "Facebook", href: social.facebookUrl },
    { Icon: TiktokIcon, name: "TikTok", href: social.tiktokUrl },
    { Icon: InstagramIcon, name: "Instagram", href: social.instagramUrl },
    { Icon: TwitterIcon, name: "X", href: social.xUrl },
    { Icon: YoutubeIcon, name: "YouTube", href: social.youtubeUrl },
  ].filter((item): item is typeof item & { href: string } => Boolean(item.href));
  const visibleColumns = footer.columns.filter((column) => column.isVisible);
  const totalCols = Math.min(Math.max(visibleColumns.length + 2, 3), 6);
  const desktopGridClass = DESKTOP_GRID_COLS[totalCols];

  return (
    <footer className="bg-brand-950 text-brand-100">
      <Container className={`grid grid-cols-2 gap-10 py-14 sm:grid-cols-2 ${desktopGridClass}`}>
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
            {settings.bottomDescription ||
              "Your trusted source for verified coupon codes and exclusive deals from thousands of top brands."}
          </p>
          {socialLinks.length > 0 && (
            <div className="mt-5 flex items-center gap-3">
              {socialLinks.map(({ Icon, name, href }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Follow us on ${name}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-brand-100 hover:bg-white/20"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}
          {(settings.hotline || settings.address || settings.email) && (
            <ul className="mt-5 space-y-2.5 text-sm text-brand-200">
              {settings.hotline && (
                <li className="flex items-start gap-2">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{settings.hotline}</span>
                </li>
              )}
              {settings.address && (
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{settings.address}</span>
                </li>
              )}
              {settings.email && (
                <li className="flex items-start gap-2">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{settings.email}</span>
                </li>
              )}
            </ul>
          )}
        </div>

        {visibleColumns.map((column) => (
          <div key={column.title}>
            <h3 className="font-heading text-sm font-semibold text-white">{column.title}</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {column.items
                .filter((item) => item.isVisible)
                .map((item, itemIndex) => {
                  const href =
                    column.type === "PATH" ? item.path! : column.type === "LINK" ? item.link! : `/${item.slug}`;
                  return (
                    <li key={`${item.name}-${itemIndex}`}>
                      {column.type === "LINK" ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-200 hover:text-white"
                        >
                          {item.name}
                        </a>
                      ) : (
                        <Link href={href} className="text-brand-200 hover:text-white">
                          {item.name}
                        </Link>
                      )}
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}

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
          <p className="text-center text-xs text-brand-300">{buildCopyright(settings)}</p>
        </Container>
      </div>
    </footer>
  );
}
