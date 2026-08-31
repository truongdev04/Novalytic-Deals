import { z } from "zod";

export const categoryFaqItemSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
});

export const adminCategorySchema = z.object({
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Lowercase kebab-case only"),
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  iconName: z.string().optional().or(z.literal("")),
  iconImageUrl: z.string().optional().or(z.literal("")),
  parentId: z.string().optional().or(z.literal("")),
  isFeatured: z.boolean(),
  faq: z.array(categoryFaqItemSchema),
  seoTitle: z.string().min(1),
  seoDescription: z.string().min(1),
});

export type AdminCategoryInput = z.infer<typeof adminCategorySchema>;
