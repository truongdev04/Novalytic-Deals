"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Ticket,
  Tags,
  FolderTree,
  CalendarDays,
  Newspaper,
  MessageSquare,
  Mail,
  Inbox,
  Users,
  Settings,
  ChevronDown,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { EditorPermission } from "@/lib/validators/admin/user";

interface FlatNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface NavChild {
  href: string;
  label: string;
}

interface ParentNavItem {
  label: string;
  icon: LucideIcon;
  children: NavChild[];
}

function buildNavItems(
  role?: "ADMIN" | "EDITOR",
  permissions: string[] = []
): (FlatNavItem | ParentNavItem)[] {
  const has = (permission: EditorPermission) =>
    role === "ADMIN" || permissions.includes(permission);

  const settingsChildren: NavChild[] = [
    ...(has("settings_general") ? [{ href: "/admin/settings", label: "General" }] : []),
    ...(has("settings_integrations")
      ? [{ href: "/admin/settings/integrations", label: "Integrations" }]
      : []),
    ...(has("settings_affiliate")
      ? [{ href: "/admin/settings/affiliate", label: "Affiliate & Redirects" }]
      : []),
    ...(has("settings_author") ? [{ href: "/admin/settings/author", label: "Author" }] : []),
    ...(has("settings_social")
      ? [{ href: "/admin/settings/social", label: "Social Network" }]
      : []),
    ...(has("settings_seo") ? [{ href: "/admin/settings/seo", label: "SEO" }] : []),
    ...(has("settings_content")
      ? [{ href: "/admin/settings/content", label: "Content Configuration" }]
      : []),
    ...(has("settings_footer") ? [{ href: "/admin/settings/footer", label: "Footer" }] : []),
  ];

  return [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    ...(has("stores") ? [{ href: "/admin/stores", label: "Stores", icon: Store }] : []),
    ...(has("coupons") ? [{ href: "/admin/coupons", label: "Coupons", icon: Ticket }] : []),
    ...(has("deals") ? [{ href: "/admin/deals", label: "Deals", icon: Tags }] : []),
    ...(has("categories")
      ? [{ href: "/admin/categories", label: "Categories", icon: FolderTree }]
      : []),
    ...(has("events") ? [{ href: "/admin/events", label: "Events", icon: CalendarDays }] : []),
    ...(has("blog")
      ? [
          {
            label: "Blog",
            icon: Newspaper,
            children: [
              { href: "/admin/blog/topics", label: "Topics" },
              { href: "/admin/blog", label: "Blog" },
            ],
          },
        ]
      : []),
    ...(has("reviews") ? [{ href: "/admin/reviews", label: "Reviews", icon: MessageSquare }] : []),
    ...(has("submissions")
      ? [{ href: "/admin/submissions", label: "Submissions", icon: Inbox }]
      : []),
    ...(has("newsletter") ? [{ href: "/admin/newsletter", label: "Newsletter", icon: Mail }] : []),
    ...(role === "ADMIN"
      ? [{ href: "/admin/users", label: "User Management", icon: Users }]
      : []),
    ...(settingsChildren.length > 0
      ? [{ label: "Settings", icon: Settings, children: settingsChildren }]
      : []),
  ];
}

const rowClassName =
  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors";
const activeClassName = "bg-brand-50 text-brand-700";
const inactiveClassName = "text-muted-600 hover:bg-surface-100 hover:text-brand-950";

// A pathname can match more than one sibling's href as a prefix (e.g.
// "/admin/blog/topics" starts with both "/admin/blog/topics" and
// "/admin/blog"). Only the most specific (longest matching href) sibling
// should be highlighted, not every one that happens to match.
function activeChildHref(children: NavChild[], pathname: string): string | null {
  let best: string | null = null;
  for (const child of children) {
    if (pathname === child.href || pathname.startsWith(child.href + "/")) {
      if (!best || child.href.length > best.length) best = child.href;
    }
  }
  return best;
}

export function AdminSidebar({
  role,
  permissions,
  mobileOpen,
  onClose,
}: {
  role?: "ADMIN" | "EDITOR";
  permissions?: string[];
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const navItems = buildNavItems(role, permissions);

  function activeParentLabel() {
    return (
      navItems.find(
        (item): item is ParentNavItem =>
          "children" in item && activeChildHref(item.children, pathname) !== null
      )?.label ?? null
    );
  }

  const [openLabel, setOpenLabel] = useState<string | null>(activeParentLabel);
  // AdminSidebar persists across client-side navigations (it doesn't remount),
  // so re-derive which submenu should be open whenever the route changes —
  // otherwise a submenu stays expanded forever once opened, even after
  // navigating away. Adjusting state during render (rather than in an effect)
  // avoids an extra commit for a value that's purely derived from `pathname`.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpenLabel(activeParentLabel());
  }

  // Desktop-only: clicking the logo/"Admin" label pins the rail collapsed
  // (icon-only). While collapsed, hovering the rail temporarily flies it
  // out to full width without shifting the page content (the reserved
  // spacer column stays icon-width) — moving the mouse away shrinks it
  // back. Clicking again returns to the normal, always-expanded rail.
  const [collapsed, setCollapsed] = useState(false);
  const [railHovering, setRailHovering] = useState(false);
  const expanded = !collapsed || railHovering;

  function renderNav(showLabels: boolean, onNavigate: () => void) {
    return (
      <nav className="space-y-1 px-3 pb-24">
        {navItems.map((item) => {
          const Icon = item.icon;

          if ("children" in item) {
            const isOpen = openLabel === item.label;
            const activeHref = activeChildHref(item.children, pathname);
            const isParentActive = activeHref !== null;
            return (
              <div key={item.label}>
                <button
                  type="button"
                  onClick={() => setOpenLabel(isOpen ? null : item.label)}
                  title={showLabels ? undefined : item.label}
                  className={cn(
                    "w-full",
                    showLabels ? "justify-between" : "justify-center",
                    rowClassName,
                    isParentActive ? activeClassName : inactiveClassName
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 shrink-0" />
                    {showLabels && item.label}
                  </span>
                  {showLabels && (
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 transition-transform duration-200",
                        isOpen && "rotate-180"
                      )}
                    />
                  )}
                </button>
                {isOpen && showLabels && (
                  <div className="ml-6 mt-1 space-y-1 border-l border-muted-200 pl-3">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onNavigate}
                        className={cn(
                          rowClassName,
                          child.href === activeHref ? activeClassName : inactiveClassName
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={showLabels ? undefined : item.label}
              className={cn(
                rowClassName,
                !showLabels && "justify-center",
                isActive ? activeClassName : inactiveClassName
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {showLabels && item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <>
      {/* Backdrop — mobile/tablet only, closes the drawer on tap outside it. */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer — independent of the desktop collapse/flyout state,
          always renders fully expanded while open. */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 -translate-x-full overflow-y-auto border-r border-muted-200 bg-surface-0 transition-transform duration-200 ease-out md:hidden",
          mobileOpen && "translate-x-0"
        )}
      >
        <div className="flex items-center justify-between px-4 py-5">
          <span className="flex items-center gap-2.5">
            <Image
              src="/images/logo/logo-xoa-nen/icon.png"
              alt="NovalyticDeals"
              width={40}
              height={40}
              className="rounded-full"
            />
            <span className="font-heading text-lg font-bold text-brand-950">Admin</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-lg p-1 text-muted-600 hover:bg-surface-100 hover:text-brand-950"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {renderNav(true, onClose)}
      </aside>

      {/* Desktop spacer — reserves layout width based on the pinned state
          (collapsed vs expanded) so the hover flyout below can overlay the
          page without shifting content. */}
      <div
        className={cn(
          "hidden shrink-0 transition-[width] duration-200 ease-out md:block",
          collapsed ? "md:w-16" : "md:w-56"
        )}
      />
      <aside
        onMouseEnter={() => collapsed && setRailHovering(true)}
        onMouseLeave={() => setRailHovering(false)}
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden overflow-y-auto border-r border-muted-200 bg-surface-0 transition-[width] duration-200 ease-out md:block",
          expanded ? "md:w-56" : "md:w-16",
          collapsed && expanded && "shadow-lg"
        )}
      >
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? "Expand menu" : "Collapse menu"}
          className={cn(
            "flex w-full items-center gap-2.5 px-4 py-5 hover:bg-surface-100",
            !expanded && "justify-center px-0"
          )}
        >
          <Image
            src="/images/logo/logo-xoa-nen/icon.png"
            alt="NovalyticDeals"
            width={40}
            height={40}
            className="shrink-0 rounded-full"
          />
          {expanded && <span className="font-heading text-lg font-bold text-brand-950">Admin</span>}
        </button>
        {renderNav(expanded, () => {})}
      </aside>
    </>
  );
}
