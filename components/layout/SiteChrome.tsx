"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// /admin/* renders its own shell (sidebar + topbar) in app/admin/layout.tsx —
// keep the public marketing Header/Footer off those routes instead of
// nesting them under a route group, per the flat app/ directory convention.
//
// Header/Footer/BackToTop are Server Components (Header fetches categories),
// so they're passed in as already-rendered nodes from the root layout rather
// than imported here — a Client Component can't import and render a Server
// Component directly, only receive one via children/props.
export function SiteChrome({
  header,
  footer,
  backToTop,
  children,
}: {
  header: ReactNode;
  footer: ReactNode;
  backToTop: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      {header}
      <main className="flex-1">{children}</main>
      {footer}
      {backToTop}
    </>
  );
}
