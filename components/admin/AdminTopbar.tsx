"use client";

import { signOut } from "next-auth/react";
import { LogOut, Menu, UserCircle } from "lucide-react";

export function AdminTopbar({
  email,
  onMenuClick,
}: {
  email: string;
  onMenuClick: () => void;
}) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-muted-200 bg-surface-0 px-4 py-3 md:justify-end md:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="rounded-lg p-1.5 text-muted-600 hover:bg-surface-100 hover:text-brand-950 md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      <span className="flex min-w-0 items-center gap-1.5 text-sm text-muted-600">
        <UserCircle className="h-4 w-4 shrink-0" />
        <span className="hidden truncate sm:inline">{email}</span>
      </span>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/admin/login" })}
        className="flex items-center gap-1.5 rounded-lg border border-muted-300 px-3 py-1.5 text-sm font-medium text-muted-600 hover:bg-surface-100 hover:text-brand-950"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </header>
  );
}
