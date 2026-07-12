import type { ReactNode } from "react";
import { auth } from "@/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  // No session here only happens on /admin/login (middleware protects the
  // rest) — render bare so the login form isn't wrapped in admin chrome.
  if (!session) {
    return <>{children}</>;
  }

  return (
    <AdminShell
      role={session.user?.role}
      permissions={session.user?.permissions}
      email={session.user?.email ?? ""}
    >
      {children}
    </AdminShell>
  );
}
