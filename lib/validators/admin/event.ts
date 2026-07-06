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
