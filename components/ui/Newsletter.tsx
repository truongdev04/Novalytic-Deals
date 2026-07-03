"use client";

import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { newsletterSchema, type NewsletterInput } from "@/lib/validators/newsletter";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { TurnstileWidget } from "@/components/forms/TurnstileWidget";
import { cn } from "@/lib/utils";

export function Newsletter({ variant = "section" }: { variant?: "section" | "footer" }) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<NewsletterInput>({ resolver: zodResolver(newsletterSchema) });

  const handleVerify = useCallback(
    (token: string) => setValue("turnstileToken", token),
    [setValue]
  );

  async function onSubmit(data: NewsletterInput) {
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("subscribe failed");
      toast.success(`You're subscribed! Check ${data.email} for confirmation soon.`);
      reset();
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  const isFooter = variant === "footer";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className={cn("w-full", isFooter && "max-w-sm")}
    >
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
        {...register("honeypot")}
      />
      <div className="flex items-stretch gap-2">
        <div className="relative flex-1">
          <Mail
            className={cn(
              "pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2",
              isFooter ? "text-white/50" : "text-muted-400"
            )}
          />
          <input
            type="email"
            placeholder="Your email"
            aria-label="Email address"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "newsletter-error" : undefined}
            className={cn(
              "h-11 w-full rounded-full border pl-10 pr-4 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
              isFooter
                ? "border-white/20 bg-white/10 text-white placeholder:text-white/50"
                : "border-muted-300 bg-surface-0 text-brand-950 placeholder:text-muted-400"
            )}
            {...register("email")}
          />
        </div>
        <Button type="submit" variant="accent" size="md" disabled={isSubmitting} className="shrink-0">
          <Mail className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only">Subscribe</span>
        </Button>
      </div>
      {errors.email && (
        <p
          id="newsletter-error"
          className={cn("mt-2 text-xs", isFooter ? "text-accent-200" : "text-red-600")}
        >
          {errors.email.message}
        </p>
      )}
      <TurnstileWidget onVerify={handleVerify} />
    </form>
  );
}
