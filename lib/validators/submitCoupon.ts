import { z } from "zod";

export const submitCouponSchema = z.object({
  storeName: z.string().min(2, "Store name is required"),
  code: z.string().max(50).optional().or(z.literal("")),
  description: z.string().min(10, "Description must be at least 10 characters").max(500),
  expiresAt: z.string().optional().or(z.literal("")),
  submitterEmail: z.string().min(1, "Email is required").email("Enter a valid email address"),
});

export type SubmitCouponInput = z.infer<typeof submitCouponSchema>;
