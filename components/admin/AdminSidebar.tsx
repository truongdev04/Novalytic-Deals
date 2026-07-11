"use client";

import { useState } from "react";
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
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

function buildNavItems(role?: "ADMIN" | "EDITOR"): (FlatNavItem | ParentNavItem)[] {
  return [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/admin/stores", label: "Stores", icon: Store },
    { href: "/admin/coupons", label: "Coupons", icon: Ticket },
    { href: "/admin/deals", label: "Deals", icon: Tags },
    { href: "/admin/categories", label: "Categories", icon: FolderTree },
    { href: "/admin/events", label: "Events", icon: CalendarDays },
    {
      label: "Blog",
      icon: Newspaper,
      children: [
        { href: "/admin/blog/topics", label: "Topics" },
        { href: "/admin/blog", label: "Blog" },
      ],
    },
    { href: "/admin/reviews", label: "Reviews", icon: MessageSquare },
    { href: "/admin/submissions", label: "Submissions", icon: Inbox },
    { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
    ...(role === "ADMIN"
      ? [{ href: "/admin/users", label: "User Management", icon: Users }]
      : []),
    {
      label: "Settings",
      icon: Settings,
      children: [
        { href: "/admin/settings", label: "General" },
        { href: "/admin/settings/integrations", label: "Integrations" },
        { href: "/admin/settings/affiliate", label: "Affiliate & Redirects" },
        ...(role === "ADMIN"
          ? [
              { href: "/admin/settings/author", label: "Author" },
              { href: "/admin/settings/social", label: "Social Network" },
              { href: "/admin/settings/seo", label: "SEO" },
              { href: "/admin/settings/content", label: "Content Configuration" },
              { href: "/admin/settings/footer", label: "Footer" },
            ]
          : []),
      ],
    },
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

export function AdminSidebar({ role }: { role?: "ADMIN" | "EDITOR" }) {
  const pathname = usePathname();
  const navItems = buildNavItems(role);

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

  return (
    <aside className="hidden w-56 shrink-0 overflow-y-auto border-r border-muted-200 bg-surface-0 md:block">
      <div className="px-4 py-5">
        <span className="font-heading text-lg font-bold text-brand-950">ND Admin</span>
      </div>
      <nav className="space-y-1 px-3">
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
                  className={cn(
                    "w-full justify-between",
                    rowClassName,
                    isParentActive ? activeClassName : inactiveClassName
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  <ChevronDown
                    className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")}
                  />
                </button>
                {isOpen && (
                  <div className="ml-6 mt-1 space-y-1 border-l border-muted-200 pl-3">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
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
              className={cn(rowClassName, isActive ? activeClassName : inactiveClassName)}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
