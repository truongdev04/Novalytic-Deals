import { z } from "zod";

export const adminBlogPostSchema = z.object({
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Lowercase kebab-case only"),
  title: z.string().min(1, "Title is required"),
  excerpt: z.string().optional().or(z.literal("")),
  coverImage: z.string().min(1, "Cover image is required"),
  authorName: z.string().optional().or(z.literal("")),
  authorAvatarUrl: z.string().optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
  topicId: z.string().optional().or(z.literal("")),
  body: z.string().min(1, "Body is required"),
  readingMinutes: z.number().min(1, "Must be 1 or more"),
  publishedAt: z.string().min(1, "Published date is required"),
  isFeatured: z.boolean(),
  isFirst: z.boolean(),
  seoTitle: z.string().optional().or(z.literal("")),
  seoDescription: z.string().optional().or(z.literal("")),
});

export type AdminBlogPostInput = z.infer<typeof adminBlogPostSchema>;
