import { z } from "zod";

export const storeFaqItemSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
});

function urlField(requiredMessage: string) {
  return z
    .string()
    .min(1, requiredMessage)
    .refine((value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    }, "Enter a valid URL");
}

export const adminStoreSchema = z.object({
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Lowercase kebab-case only"),
  name: z.string().min(1, "Name is required"),
  logoUrl: z.string().min(1, "Logo is required"),
  bannerUrl: z.string().optional().or(z.literal("")),
  website: urlField("Website is required"),
  affiliateNetwork: urlField("Affiliate link is required"),
  categoryIds: z.array(z.string()).length(1, "Select a category"),
  eventId: z.string().nullable(),
  description: z.string().optional().or(z.literal("")),
  aboutStore: z.string().optional().or(z.literal("")),
  howToApply: z.string().optional().or(z.literal("")),
  faq: z.array(storeFaqItemSchema),
  isFeatured: z.boolean(),
  seoTitle: z.string().optional().or(z.literal("")),
  seoDescription: z.string().optional().or(z.literal("")),
});

export type AdminStoreInput = z.infer<typeof adminStoreSchema>;
