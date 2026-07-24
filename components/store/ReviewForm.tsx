"use client";

import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Star } from "lucide-react";
import { reviewSchema, type ReviewInput } from "@/lib/validators/review";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { TurnstileWidget } from "@/components/forms/TurnstileWidget";
import { cn } from "@/lib/utils";

const fieldClassName =
  "w-full rounded-xl border border-muted-300 bg-surface-0 px-4 py-2.5 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";

export function ReviewForm({ storeSlug }: { storeSlug: string }) {
  const [hoverRating, setHoverRating] = useState(0);
  const [rating, setRating] = useState(0);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ReviewInput>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0 },
  });

  const handleVerify = useCallback(
    (token: string) => setValue("turnstileToken", token),
    [setValue]
  );

  function selectRating(value: number) {
    setRating(value);
    setValue("rating", value, { shouldValidate: true });
  }

  async function onSubmit(data: ReviewInput) {
    try {
      const res = await fetch(`/api/stores/${storeSlug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("submit failed");
      toast.success("Thanks! Your review was submitted for moderation.");
      reset({ rating: 0 });
      setRating(0);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
        {...register("honeypot")}
      />

      <div>
        <span className="mb-1.5 block text-sm font-medium text-brand-950">Your rating</span>
        <div
          className="flex items-center gap-1"
          onMouseLeave={() => setHoverRating(0)}
          role="radiogroup"
          aria-label="Rating"
        >
          {Array.from({ length: 5 }).map((_, i) => {
            const starValue = i + 1;
            return (
              <button
                key={starValue}
                type="button"
                role="radio"
                aria-checked={rating === starValue}
                aria-label={`${starValue} star${starValue > 1 ? "s" : ""}`}
                onMouseEnter={() => setHoverRating(starValue)}
                onClick={() => selectRating(starValue)}
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
              >
                <Star
                  width={22}
                  height={22}
                  className={cn(
                    (hoverRating || rating) >= starValue
                      ? "fill-accent-400 text-accent-400"
                      : "fill-muted-200 text-muted-200"
                  )}
                />
              </button>
            );
          })}
        </div>
        {errors.rating && <p className="mt-1 text-xs text-red-600">{errors.rating.message}</p>}
      </div>

      <div>
        <label htmlFor="authorName" className="mb-1.5 block text-sm font-medium text-brand-950">
          Your name
        </label>
        <input
          id="authorName"
          aria-invalid={Boolean(errors.authorName)}
          aria-describedby={errors.authorName ? "authorName-error" : undefined}
          className={fieldClassName}
          {...register("authorName")}
        />
        {errors.authorName && (
          <p id="authorName-error" className="mt-1 text-xs text-red-600">
            {errors.authorName.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="reviewTitle" className="mb-1.5 block text-sm font-medium text-brand-950">
          Title
        </label>
        <input
          id="reviewTitle"
          placeholder="Summarize your experience"
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? "reviewTitle-error" : undefined}
          className={fieldClassName}
          {...register("title")}
        />
        {errors.title && (
          <p id="reviewTitle-error" className="mt-1 text-xs text-red-600">
            {errors.title.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="reviewBody" className="mb-1.5 block text-sm font-medium text-brand-950">
          Review
        </label>
        <textarea
          id="reviewBody"
          rows={4}
          placeholder="What was your experience with this store?"
          aria-invalid={Boolean(errors.body)}
          aria-describedby={errors.body ? "reviewBody-error" : undefined}
          className={fieldClassName}
          {...register("body")}
        />
        {errors.body && (
          <p id="reviewBody-error" className="mt-1 text-xs text-red-600">
            {errors.body.message}
          </p>
        )}
      </div>

      <TurnstileWidget onVerify={handleVerify} />

      <Button type="submit" disabled={isSubmitting} className="rounded-xl">
        {isSubmitting ? "Submitting..." : "Submit review"}
      </Button>
    </form>
  );
}
