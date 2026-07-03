import { z } from "zod";

export const adminEventSchema = z.object({
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Lowercase kebab-case only"),
  name: z.string().min(1, "Name is required"),
  iconName: z.string().min(1, "Icon name is required"),
  description: z.string().min(1, "Description is required"),
  bannerUrl: z.string().optional().or(z.literal("")),
  startsAt: z.string().min(1, "Start date is required"),
  endsAt: z.string().min(1, "End date is required"),
  featuredStoreIds: z.array(z.string()),
  featuredCouponIds: z.array(z.string()),
});

export type AdminEventInput = z.infer<typeof adminEventSchema>;
