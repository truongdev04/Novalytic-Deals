"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// /admin/* renders its own shell (sidebar + topbar) in app/admin/layout.tsx —
// keep the public marketing Header/Footer off those routes instead of
// nesting them under a route group, per the flat app/ directory convention.
//
// Header/Footer/BackToTop/AnalyticsScripts are Server Components (Header
// fetches categories), so they're passed in as already-rendered nodes from
// the root layout rather than imported here — a Client Component can't
// import and render a Server Component directly, only receive one via
// children/props. Analytics is gated the same way as Header/Footer so
// GTM/GA/Plausible never load on internal admin pages.
//
// headScripts/bodyScript/footerScript (admin-authored raw Custom Scripts,
// see /admin/settings/scripts) ride the same isAdmin gate for the same
// reason. headScripts uses next/script's beforeInteractive strategy, which
// Next.js hoists into the real <head> regardless of where in the tree it's
// rendered, so nesting it here (rather than literally inside <head>) doesn't
// affect its actual position in the output HTML.
export function SiteChrome({
  header,
  footer,
  backToTop,
  analytics,
  headScripts,
  bodyScript,
  footerScript,
  children,
}: {
  header: ReactNode;
  footer: ReactNode;
  backToTop: ReactNode;
  analytics: ReactNode;
  headScripts: ReactNode;
  bodyScript: ReactNode;
  footerScript: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      {headScripts}
      {bodyScript}
      {header}
      <main className="flex-1">{children}</main>
      {footer}
      {backToTop}
      {analytics}
      {footerScript}
    </>
  );
}
