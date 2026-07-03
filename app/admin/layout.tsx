import type { ReactNode } from "react";
import { auth } from "@/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  // No session here only happens on /admin/login (middleware protects the
  // rest) — render bare so the login form isn't wrapped in admin chrome.
  if (!session) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminTopbar email={session.user?.email ?? ""} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
