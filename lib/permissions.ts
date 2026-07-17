import type { EditorPermission } from "@/lib/validators/admin/user";

export const ADMIN_ONLY = "ADMIN_ONLY" as const;

/**
 * Maps an /admin/* or /api/admin/* pathname prefix to the permission
 * required to access it. Ordered arbitrarily — getRequiredPermission()
 * sorts by prefix length so more specific routes (e.g. "/admin/settings/seo")
 * are matched before broader ones (e.g. "/admin/settings").
 */
const ROUTE_PERMISSIONS: { prefix: string; permission: EditorPermission | typeof ADMIN_ONLY }[] = [
  { prefix: "/admin/users", permission: ADMIN_ONLY },
  { prefix: "/api/admin/users", permission: ADMIN_ONLY },

  { prefix: "/admin/stores", permission: "stores" },
  { prefix: "/api/admin/stores", permission: "stores" },
  { prefix: "/admin/coupons", permission: "coupons" },
  { prefix: "/api/admin/coupons", permission: "coupons" },
  { prefix: "/admin/deals", permission: "deals" },
  { prefix: "/api/admin/deals", permission: "deals" },
  { prefix: "/admin/categories", permission: "categories" },
  { prefix: "/api/admin/categories", permission: "categories" },
  { prefix: "/admin/events", permission: "events" },
  { prefix: "/api/admin/events", permission: "events" },
  { prefix: "/admin/blog", permission: "blog" },
  { prefix: "/api/admin/blog", permission: "blog" },
  { prefix: "/api/admin/blog-topics", permission: "blog" },
  { prefix: "/admin/reviews", permission: "reviews" },
  { prefix: "/api/admin/reviews", permission: "reviews" },
  { prefix: "/admin/submissions", permission: "submissions" },
  { prefix: "/api/admin/submitted-coupons", permission: "submissions" },
  { prefix: "/admin/newsletter", permission: "newsletter" },
  { prefix: "/api/admin/newsletter", permission: "newsletter" },

  { prefix: "/admin/settings/integrations", permission: "settings_integrations" },
  { prefix: "/api/admin/settings/integrations", permission: "settings_integrations" },
  { prefix: "/admin/settings/affiliate", permission: "settings_affiliate" },
  { prefix: "/api/admin/redirects", permission: "settings_affiliate" },
  { prefix: "/admin/settings/author", permission: "settings_author" },
  { prefix: "/api/admin/settings/author", permission: "settings_author" },
  { prefix: "/admin/settings/social", permission: "settings_social" },
  { prefix: "/api/admin/settings/social", permission: "settings_social" },
  { prefix: "/admin/settings/seo", permission: "settings_seo" },
  { prefix: "/api/admin/settings/seo", permission: "settings_seo" },
  { prefix: "/admin/settings/content", permission: "settings_content" },
  { prefix: "/api/admin/settings/content", permission: "settings_content" },
  { prefix: "/admin/settings/footer", permission: "settings_footer" },
  { prefix: "/api/admin/settings/footer", permission: "settings_footer" },
  // Broadest settings rules last so the specific ones above win.
  { prefix: "/admin/settings", permission: "settings_general" },
  { prefix: "/api/admin/settings/general", permission: "settings_general" },
  { prefix: "/api/admin/settings/cache-purge", permission: "settings_general" },
];

const SORTED_ROUTE_PERMISSIONS = [...ROUTE_PERMISSIONS].sort(
  (a, b) => b.prefix.length - a.prefix.length
);

/**
 * Returns the permission required for a given pathname:
 *  - null: open to any authenticated admin/editor (Dashboard, shared upload endpoint)
 *  - ADMIN_ONLY: only role === "ADMIN" may access it
 *  - EditorPermission: an EDITOR needs this key in their permissions[] array
 *
 * Anything under /admin or /api/admin that isn't explicitly mapped falls
 * back to ADMIN_ONLY — fail safe rather than silently letting new routes
 * through unguarded.
 */
export function getRequiredPermission(
  pathname: string
): EditorPermission | typeof ADMIN_ONLY | null {
  if (pathname === "/admin" || pathname === "/admin/login") return null;
  if (pathname === "/api/admin/upload" || pathname.startsWith("/api/admin/upload/")) return null;
  // Self-status check — every authenticated admin/editor polls this to
  // detect their own account being deactivated/deleted mid-session.
  if (pathname === "/api/admin/session/status") return null;

  const match = SORTED_ROUTE_PERMISSIONS.find(
    (route) => pathname === route.prefix || pathname.startsWith(`${route.prefix}/`)
  );
  if (match) return match.permission;

  if (pathname.startsWith("/admin/") || pathname.startsWith("/api/admin/")) return ADMIN_ONLY;
  return null;
}

export function canAccess(
  role: "ADMIN" | "EDITOR" | undefined,
  permissions: string[] | undefined,
  pathname: string
): boolean {
  if (role === "ADMIN") return true;

  const required = getRequiredPermission(pathname);
  if (required === null) return true;
  if (required === ADMIN_ONLY) return false;
  return (permissions ?? []).includes(required);
}
