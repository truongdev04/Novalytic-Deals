import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ForgotPasswordForm } from "@/components/admin/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password | NovalyticDeals Admin",
  robots: { index: false, follow: false },
};

export default async function AdminForgotPasswordPage() {
  const session = await auth();
  if (session) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-muted-200 bg-surface-0 p-8 shadow-sm">
        <h1 className="font-heading text-xl font-bold text-brand-950">Forgot password</h1>
        <p className="mt-1 text-sm text-muted-600">
          Enter your admin email to receive a verification code.
        </p>
        <div className="mt-6">
          <Suspense>
            <ForgotPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
