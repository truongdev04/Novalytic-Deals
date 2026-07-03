import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Admin Login | NovalyticDeals",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const session = await auth();
  if (session) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-muted-200 bg-surface-0 p-8 shadow-sm">
        <h1 className="font-heading text-xl font-bold text-brand-950">NovalyticDeals Admin</h1>
        <p className="mt-1 text-sm text-muted-600">Sign in to manage the site.</p>
        <div className="mt-6">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
