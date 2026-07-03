"use client";

import { signOut } from "next-auth/react";
import { LogOut, UserCircle } from "lucide-react";

export function AdminTopbar({ email }: { email: string }) {
  return (
    <header className="flex items-center justify-end gap-4 border-b border-muted-200 bg-surface-0 px-6 py-3">
      <span className="flex items-center gap-1.5 text-sm text-muted-600">
        <UserCircle className="h-4 w-4" />
        {email}
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
