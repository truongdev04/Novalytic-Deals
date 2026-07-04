import { z } from "zod";

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

export const adminCouponSchema = z.object({
  storeId: z.string().min(1, "Store is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Lowercase kebab-case only"),
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  type: z.enum(["CODE", "DEAL", "CASHBACK", "FREESHIP", "BOGO"]),
  code: z.string().optional().or(z.literal("")),
  discountType: z.enum(["PERCENT", "AMOUNT", "OTHER"]),
  discountValue: z.number().min(0, "Must be 0 or more"),
  currency: z.string().min(1, "Currency is required"),
  affiliateUrl: urlField("Affiliate link is required"),
  exclusive: z.boolean(),
  verified: z.boolean(),
  terms: z.string(),
  startsAt: z.string(),
  expiresAt: z.string().optional().or(z.literal("")),
  isFeatured: z.boolean(),
  isTrending: z.boolean(),
});

export type AdminCouponInput = z.infer<typeof adminCouponSchema>;
