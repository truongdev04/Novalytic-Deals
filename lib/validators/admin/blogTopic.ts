import { z } from "zod";

export const adminBlogTopicSchema = z.object({
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Lowercase kebab-case only"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().or(z.literal("")),
});

export type AdminBlogTopicInput = z.infer<typeof adminBlogTopicSchema>;
