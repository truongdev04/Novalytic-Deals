"use client";

import { useCallback, useState, type ChangeEvent } from "react";
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

const BODY_MAX_LENGTH = 5000;

export function ReviewForm({
  storeSlug,
  storeName,
  onSubmitted,
  onCancel,
}: {
  storeSlug: string;
  storeName: string;
  onSubmitted?: () => void;
  onCancel?: () => void;
}) {
  const [hoverRating, setHoverRating] = useState(0);
  const [rating, setRating] = useState(0);
  const [bodyLength, setBodyLength] = useState(0);
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
      toast.success("Thanks! Your review is now live.");
      reset({ rating: 0 });
      setRating(0);
      setBodyLength(0);
      onSubmitted?.();
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
        <span className="mb-1.5 block text-sm font-medium text-brand-950">
          How would you rate your experience with {storeName}?
        </span>
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
                  width={26}
                  height={26}
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
        <textarea
          id="reviewBody"
          rows={4}
          maxLength={BODY_MAX_LENGTH}
          placeholder="Share your experience (optional — minimum 25 characters if entered)..."
          aria-invalid={Boolean(errors.body)}
          aria-describedby={errors.body ? "reviewBody-error" : undefined}
          className={fieldClassName}
          {...register("body", {
            onChange: (e: ChangeEvent<HTMLTextAreaElement>) =>
              setBodyLength(e.target.value.length),
          })}
        />
        <div className="mt-1 flex items-center justify-between">
          {errors.body ? (
            <p id="reviewBody-error" className="text-xs text-red-600">
              {errors.body.message}
            </p>
          ) : (
            <span />
          )}
          <span className="text-xs text-muted-400">
            {bodyLength} / {BODY_MAX_LENGTH}
          </span>
        </div>
      </div>

      <div>
        <label htmlFor="authorName" className="mb-1.5 block text-sm font-medium text-brand-950">
          Display name <span className="text-muted-400">(optional)</span>
        </label>
        <input
          id="authorName"
          placeholder="Anonymous"
          aria-invalid={Boolean(errors.authorName)}
          aria-describedby={errors.authorName ? "authorName-error" : "authorName-hint"}
          className={fieldClassName}
          {...register("authorName")}
        />
        {errors.authorName ? (
          <p id="authorName-error" className="mt-1 text-xs text-red-600">
            {errors.authorName.message}
          </p>
        ) : (
          <p id="authorName-hint" className="mt-1 text-xs text-muted-500">
            Others will see your display name
          </p>
        )}
      </div>

      <TurnstileWidget onVerify={handleVerify} appearance="interaction-only" />

      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" className="rounded-xl" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1 rounded-xl">
          {isSubmitting ? "Submitting..." : "Post review"}
        </Button>
      </div>

      <p className="text-center text-xs text-muted-500">
        By submitting your review, you consent to disclose your display name publicly on
        NovalyticDeals.
      </p>
    </form>
  );
}
