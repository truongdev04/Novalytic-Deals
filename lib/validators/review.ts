import { z } from "zod";

export const reviewSchema = z.object({
  authorName: z.string().min(2, "Name is required").max(80),
  rating: z
    .number({ error: "Choose a rating" })
    .int()
    .min(1, "Choose a rating")
    .max(5, "Choose a rating"),
  title: z.string().min(3, "Title is required").max(120),
  body: z.string().min(10, "Review must be at least 10 characters").max(2000),
  turnstileToken: z.string().optional(),
  honeypot: z.string().optional(),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
