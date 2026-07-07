import { z } from "zod";

export const adminGeneralSettingsSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  logoUrl: z.string().optional().or(z.literal("")),
  faviconUrl: z.string().optional().or(z.literal("")),
  ogImage: z.string().optional().or(z.literal("")),
  robotsIndexingEnabled: z.boolean(),
  sitemapEnabled: z.boolean(),
});
export type AdminGeneralSettingsInput = z.infer<typeof adminGeneralSettingsSchema>;

export const adminIntegrationsSettingsSchema = z.object({
  resendApiKey: z.string().optional().or(z.literal("")),
  contactInboxEmail: z.string().email("Enter a valid email").optional().or(z.literal("")),
  turnstileSecretKey: z.string().optional().or(z.literal("")),
  gaId: z.string().optional().or(z.literal("")),
  plausibleDomain: z.string().optional().or(z.literal("")),
  clearFields: z.array(z.enum(["resendApiKey", "turnstileSecretKey"])).optional(),
});
export type AdminIntegrationsSettingsInput = z.infer<typeof adminIntegrationsSettingsSchema>;

export const adminAffiliateSettingsSchema = z.object({
  defaultAffiliateNetwork: z.string().optional().or(z.literal("")),
});
export type AdminAffiliateSettingsInput = z.infer<typeof adminAffiliateSettingsSchema>;

export const cachePurgeSchema = z.union([
  z.object({ all: z.literal(true) }),
  z.object({ tag: z.string().min(1, "Tag is required") }),
]);
export type CachePurgeInput = z.infer<typeof cachePurgeSchema>;
