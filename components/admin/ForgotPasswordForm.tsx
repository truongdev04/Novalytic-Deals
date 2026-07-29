"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "nextjs-toploader/app";
import { Button } from "@/components/ui/Button";
import { TurnstileWidget } from "@/components/forms/TurnstileWidget";

const fieldClassName =
  "w-full rounded-lg border border-muted-300 bg-surface-0 px-4 py-2.5 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";

type Step = "email" | "code";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmitEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailError(null);
    setIsSubmitting(true);

    const res = await fetch("/api/admin/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, turnstileToken: turnstileToken ?? undefined }),
    });

    const data = await res.json().catch(() => null);
    setIsSubmitting(false);

    if (!res.ok) {
      setEmailError(data?.error ?? "Something went wrong. Please try again.");
      return;
    }

    setInfo("A verification code has been sent to your email.");
    setStep("code");
  }

  async function onSubmitCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const res = await fetch("/api/admin/forgot-password/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });

    const data = await res.json().catch(() => null);
    setIsSubmitting(false);

    if (!res.ok || !data?.data?.resetToken) {
      setError(data?.error ?? "Invalid or expired code.");
      return;
    }

    router.push(`/admin/reset-password?token=${encodeURIComponent(data.data.resetToken)}`);
  }

  if (step === "code") {
    return (
      <form onSubmit={onSubmitCode} className="space-y-4">
        {info && <p className="text-sm text-muted-600">{info}</p>}
        <div>
          <label htmlFor="code" className="mb-1.5 block text-sm font-medium text-brand-950">
            Verification code
          </label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            required
            className={fieldClassName}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={isSubmitting || code.length !== 6} className="w-full">
          {isSubmitting ? "Verifying..." : "Verify code"}
        </Button>
        <p className="text-center text-sm text-muted-600">
          <Link href="/admin/login" className="text-brand-700 hover:underline">
            Back to login
          </Link>
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmitEmail} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-brand-950">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          className={fieldClassName}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {emailError && <p className="mt-1 text-xs text-red-600">{emailError}</p>}
      </div>
      <TurnstileWidget onVerify={setTurnstileToken} appearance="interaction-only" />
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Sending..." : "Send verification code"}
      </Button>
      <p className="text-center text-sm text-muted-600">
        <Link href="/admin/login" className="text-brand-700 hover:underline">
          Back to login
        </Link>
      </p>
    </form>
  );
}
