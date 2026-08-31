import { z } from "zod";

export const adminEventSchema = z.object({
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Lowercase kebab-case only"),
  name: z.string().min(1, "Name is required"),
  iconName: z.string().optional().or(z.literal("")),
  iconImageUrl: z.string().optional().or(z.literal("")),
  description: z.string().min(1, "Description is required"),
  bannerUrl: z.string().optional().or(z.literal("")),
  startsAt: z.string().optional().or(z.literal("")),
  endsAt: z.string().optional().or(z.literal("")),
  featuredCouponIds: z.array(z.string()),
});

export type AdminEventInput = z.infer<typeof adminEventSchema>;

export const adminEventBulkAssignSchema = z.object({
  eventId: z.string().min(1, "Event is required"),
  count: z.coerce.number().int("Must be a whole number").min(1, "Must be at least 1"),
});

export type AdminEventBulkAssignInput = z.infer<typeof adminEventBulkAssignSchema>;

export const adminEventBulkResetSchema = z
  .object({
    eventId: z.string().min(1, "Event is required"),
    all: z.boolean(),
    count: z.coerce.number().int("Must be a whole number").min(1, "Must be at least 1").optional(),
  })
  .refine((data) => data.all || typeof data.count === "number", {
    message: "Count is required unless resetting all stores",
    path: ["count"],
  });

export type AdminEventBulkResetInput = z.infer<typeof adminEventBulkResetSchema>;

// `eventId: "all"` re-rolls the curated coupons of every event the caller
// can access; any other value targets that one event.
export const adminEventRandomizeCouponsSchema = z.object({
  eventId: z.string().min(1, "Event is required"),
});

export type AdminEventRandomizeCouponsInput = z.infer<typeof adminEventRandomizeCouponsSchema>;
