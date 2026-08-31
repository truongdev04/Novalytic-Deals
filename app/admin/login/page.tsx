import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { firstAccessiblePath } from "@/lib/permissions";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Admin Login | NovalyticDeals",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const session = await auth();
  const destination = session
    ? firstAccessiblePath(session.user?.role, session.user?.permissions)
    : null;
  // Only redirect a signed-in user somewhere they can actually go — an editor
  // with no sections assigned stays here and sees the notice below.
  if (destination && destination !== "/admin/login") redirect(destination);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-muted-200 bg-surface-0 p-8 shadow-sm">
        <h1 className="font-heading text-xl font-bold text-brand-950">NovalyticDeals Admin</h1>
        <p className="mt-1 text-sm text-muted-600">
          {session
            ? "Your account has no admin sections assigned yet — ask an administrator to grant access."
            : "Sign in to manage the site."}
        </p>
        <div className="mt-6">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
