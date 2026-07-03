import { z } from "zod";

export const newsletterSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  turnstileToken: z.string().optional(),
  honeypot: z.string().optional(),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;
