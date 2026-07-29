import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";
import { redis } from "@/lib/server/cache/redis";
import { canAccess } from "@/lib/permissions";

const { auth } = NextAuth(authConfig);

// Admin forgot-password flow must stay reachable without a session — it's
// how a locked-out admin recovers access in the first place.
const PUBLIC_ADMIN_PAGES = ["/admin/login", "/admin/forgot-password", "/admin/reset-password"];
const PUBLIC_ADMIN_API_PREFIXES = ["/api/admin/forgot-password", "/api/admin/reset-password"];

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const isAdminApi =
    pathname.startsWith("/api/admin") &&
    !PUBLIC_ADMIN_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isAdminPage = pathname.startsWith("/admin") && !PUBLIC_ADMIN_PAGES.includes(pathname);

  if (!isAdminApi && !pathname.startsWith("/admin") && !pathname.startsWith("/_next")) {
    const rule = redis ? await redis.hget<{ destination: string; type: "PERMANENT" | "TEMPORARY" }>(
      "redirects:active",
      pathname
    ) : null;
    if (rule) {
      return NextResponse.redirect(
        new URL(rule.destination, req.url),
        rule.type === "PERMANENT" ? 308 : 307
      );
    }
  }

  if (!req.auth && (isAdminApi || isAdminPage)) {
    if (isAdminApi) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  if (
    (isAdminApi || isAdminPage) &&
    !canAccess(req.auth?.user?.role, req.auth?.user?.permissions, pathname)
  ) {
    if (isAdminApi) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/admin", req.url));
  }
});

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/((?!_next|api).*)"],
};
