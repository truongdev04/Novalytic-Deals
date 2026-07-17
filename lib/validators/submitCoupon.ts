import { z } from "zod";

export const discountUnitOptions = ["%", "$", "€", "£"] as const;

export const submitCouponSchema = z.object({
  storeName: z.string().min(2, "Store name is required"),
  websiteUrl: z.string().min(1, "Website link is required").url("Enter a valid URL"),
  code: z.string().max(50).optional().or(z.literal("")),
  discountUnit: z.enum(discountUnitOptions, { message: "Choose a discount unit" }),
  discountValue: z.number({ error: "Enter a discount value" }).positive("Enter a discount value"),
  description: z.string().min(10, "Description must be at least 10 characters").max(500),
  expiresAt: z.string().optional().or(z.literal("")),
  submitterEmail: z.string().min(1, "Email is required").email("Enter a valid email address"),
  turnstileToken: z.string().optional(),
  honeypot: z.string().optional(),
});

export type SubmitCouponInput = z.infer<typeof submitCouponSchema>;
