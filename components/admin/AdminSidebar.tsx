"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Ticket,
  FolderTree,
  CalendarDays,
  Newspaper,
  MessageSquare,
  Mail,
  Inbox,
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

interface ParentNavItem {
  label: string;
  icon: LucideIcon;
  children: { href: string; label: string }[];
}

const navItems: (FlatNavItem | ParentNavItem)[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/stores", label: "Stores", icon: Store },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket },
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
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const rowClassName =
  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors";
const activeClassName = "bg-brand-50 text-brand-700";
const inactiveClassName = "text-muted-600 hover:bg-surface-100 hover:text-brand-950";

export function AdminSidebar() {
  const pathname = usePathname();
  const [openLabel, setOpenLabel] = useState<string | null>(
    () => navItems.find((item) => "children" in item && pathname.startsWith("/admin/blog"))?.label ?? null
  );

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
            const isParentActive = item.children.some((child) => pathname.startsWith(child.href));
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
                    {item.children.map((child) => {
                      const isTopicsChild = child.href === "/admin/blog/topics";
                      const isChildActive = isTopicsChild
                        ? pathname.startsWith("/admin/blog/topics")
                        : pathname.startsWith("/admin/blog") && !pathname.startsWith("/admin/blog/topics");
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(rowClassName, isChildActive ? activeClassName : inactiveClassName)}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
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
