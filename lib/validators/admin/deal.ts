import { z } from "zod";

function urlField(requiredMessage: string) {
  return z
    .string()
    .min(1, requiredMessage)
    .refine((value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    }, "Enter a valid URL");
}

export const adminDealSchema = z
  .object({
    storeId: z.string().min(1, "Store is required"),
    slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Lowercase kebab-case only"),
    name: z.string().min(1, "Name is required"),
    type: z.enum(["DEAL", "CODE"]),
    code: z.string().optional().or(z.literal("")),
    eventId: z.string().nullable(),
    categoryId: z.string().nullable(),
    originalPrice: z.number().min(0, "Must be 0 or more").optional(),
    price: z.number().min(0, "Must be 0 or more"),
    offer: z.string().optional().or(z.literal("")),
    url: urlField("URL is required"),
    imageUrl: z.string().min(1, "Image is required"),
    description: z.string().optional().or(z.literal("")),
    isFeatured: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "CODE" && !data.code?.trim()) {
      ctx.addIssue({ code: "custom", message: "Code is required when Type is Code", path: ["code"] });
    }
  });

export type AdminDealInput = z.infer<typeof adminDealSchema>;
