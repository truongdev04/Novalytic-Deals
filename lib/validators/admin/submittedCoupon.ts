import { z } from "zod";

export const adminSubmittedCouponSchema = z.object({
  title: z.string().min(1, "Title is required"),
  storeName: z.string().min(1, "Store name is required"),
  websiteUrl: z
    .string()
    .min(1, "Website URL is required")
    .refine((value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    }, "Enter a valid URL"),
  code: z.string().optional().or(z.literal("")),
  discountUnit: z.string().min(1, "Discount unit is required"),
  discountValue: z.number().min(0, "Must be 0 or more"),
  description: z.string().min(1, "Description is required"),
  expiresAt: z.string().optional().or(z.literal("")),
  submitterEmail: z.string().email("Enter a valid email"),
});

export type AdminSubmittedCouponInput = z.infer<typeof adminSubmittedCouponSchema>;
