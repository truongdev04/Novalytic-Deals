import { z } from "zod";

export const adminCategorySchema = z.object({
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Lowercase kebab-case only"),
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  iconName: z.string().min(1, "Icon name is required"),
  parentId: z.string().optional().or(z.literal("")),
  isFeatured: z.boolean(),
  seoTitle: z.string().min(1),
  seoDescription: z.string().min(1),
});

export type AdminCategoryInput = z.infer<typeof adminCategorySchema>;
