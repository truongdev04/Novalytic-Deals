import { z } from "zod";

export const reviewSchema = z.object({
  authorName: z.string().max(80).optional(),
  rating: z
    .number({ error: "Choose a rating" })
    .int()
    .min(1, "Choose a rating")
    .max(5, "Choose a rating"),
  body: z.string().max(5000).optional(),
  turnstileToken: z.string().optional(),
  honeypot: z.string().optional(),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
