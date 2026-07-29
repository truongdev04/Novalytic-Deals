import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ResetPasswordForm } from "@/components/admin/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password | NovalyticDeals Admin",
  robots: { index: false, follow: false },
};

export default async function AdminResetPasswordPage() {
  const session = await auth();
  if (session) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-muted-200 bg-surface-0 p-8 shadow-sm">
        <h1 className="font-heading text-xl font-bold text-brand-950">Reset password</h1>
        <p className="mt-1 text-sm text-muted-600">Choose a new password for your admin account.</p>
        <div className="mt-6">
          <Suspense>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
