"use client";

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
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/stores", label: "Stores", icon: Store },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/events", label: "Events", icon: CalendarDays },
  { href: "/admin/blog", label: "Blog", icon: Newspaper },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquare },
  { href: "/admin/submissions", label: "Submissions", icon: Inbox },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 overflow-y-auto border-r border-muted-200 bg-surface-0 md:block">
      <div className="px-4 py-5">
        <span className="font-heading text-lg font-bold text-brand-950">ND Admin</span>
      </div>
      <nav className="space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-muted-600 hover:bg-surface-100 hover:text-brand-950"
              )}
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
