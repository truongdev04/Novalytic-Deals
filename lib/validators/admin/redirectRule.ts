import { z } from "zod";

export const adminRedirectRuleSchema = z
  .object({
    source: z
      .string()
      .min(1, "Source path is required")
      .regex(/^\//, "Must start with /"),
    destination: z.string().min(1, "Destination is required"),
    type: z.enum(["PERMANENT", "TEMPORARY"]),
    isActive: z.boolean(),
  })
  .refine((v) => v.source !== v.destination, {
    message: "Source and destination must differ",
    path: ["destination"],
  });

export type AdminRedirectRuleInput = z.infer<typeof adminRedirectRuleSchema>;
