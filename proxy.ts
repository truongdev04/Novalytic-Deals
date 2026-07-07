import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";
import { redis } from "@/lib/server/cache/redis";

const ADMIN_ONLY_PREFIXES = [
  "/api/admin/users",
  "/admin/settings/users",
  "/api/admin/settings/integrations",
  "/api/admin/settings/cache-purge",
];

const { auth } = NextAuth(authConfig);

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const isAdminApi = pathname.startsWith("/api/admin");
  const isAdminPage = pathname.startsWith("/admin") && pathname !== "/admin/login";

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

  const isAdminOnly = ADMIN_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isAdminOnly && req.auth?.user?.role !== "ADMIN") {
    if (isAdminApi) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/admin", req.url));
  }
});

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/((?!_next|api).*)"],
};
