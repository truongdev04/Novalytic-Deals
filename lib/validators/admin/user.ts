import { z } from "zod";

export const passwordSchema = z.string().min(8, "Password must be at least 8 characters");

// Functional areas an EDITOR can be granted access to. Every admin section
// except User Management (Admin-only) has a permission key here; this list
// is the single source of truth consumed by both the sidebar
// (components/admin/AdminSidebar.tsx) and route enforcement (lib/permissions.ts).
export const EDITOR_PERMISSION_VALUES = [
  "stores",
  "coupons",
  "deals",
  "categories",
  "events",
  "blog",
  "reviews",
  "submissions",
  "newsletter",
  "settings_general",
  "settings_integrations",
  "settings_affiliate",
  "settings_author",
  "settings_social",
  "settings_seo",
  "settings_content",
  "settings_footer",
] as const;
export type EditorPermission = (typeof EDITOR_PERMISSION_VALUES)[number];

export const EDITOR_PERMISSION_OPTIONS: { value: EditorPermission; label: string }[] = [
  { value: "stores", label: "Stores" },
  { value: "coupons", label: "Coupons" },
  { value: "deals", label: "Deals" },
  { value: "categories", label: "Categories" },
  { value: "events", label: "Events" },
  { value: "blog", label: "Blog" },
  { value: "reviews", label: "Reviews" },
  { value: "submissions", label: "Submissions" },
  { value: "newsletter", label: "Newsletter" },
  { value: "settings_general", label: "Settings: General" },
  { value: "settings_integrations", label: "Settings: Integrations" },
  { value: "settings_affiliate", label: "Settings: Affiliate & Redirects" },
  { value: "settings_author", label: "Settings: Author" },
  { value: "settings_social", label: "Settings: Social Network" },
  { value: "settings_seo", label: "Settings: SEO" },
  { value: "settings_content", label: "Settings: Content Configuration" },
  { value: "settings_footer", label: "Settings: Footer" },
];

// The subset of EDITOR_PERMISSION_VALUES that supports per-record ownership
// scoping ("full data access" switch) — genuinely admin-authored content
// only. Excludes settings_* (no per-record concept) and reviews/submissions/
// newsletter (always created by public visitors, never by an editor, so
// "own data only" has no meaningful referent for them).
export const DATA_SCOPED_PERMISSION_VALUES = [
  "stores",
  "coupons",
  "deals",
  "categories",
  "events",
  "blog",
] as const satisfies readonly EditorPermission[];
export type DataScopedPermission = (typeof DATA_SCOPED_PERMISSION_VALUES)[number];

export function isDataScopedPermission(value: EditorPermission): value is DataScopedPermission {
  return (DATA_SCOPED_PERMISSION_VALUES as readonly string[]).includes(value);
}

export const adminCreateUserSchema = z
  .object({
    email: z.string().min(1, "Email is required").email("Enter a valid email"),
    role: z.enum(["ADMIN", "EDITOR"]),
    password: passwordSchema,
    fullName: z.string().min(1, "Full name is required"),
    avatarUrl: z.string().optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    permissions: z.array(z.enum(EDITOR_PERMISSION_VALUES)),
    fullDataAccess: z.array(z.enum(DATA_SCOPED_PERMISSION_VALUES)),
  })
  .refine((data) => data.fullDataAccess.every((key) => data.permissions.includes(key)), {
    message: "Full data access requires the matching module permission to be enabled.",
    path: ["fullDataAccess"],
  });
export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;

// Full profile edit (existing user). `password` is optional here — leave it
// blank to keep the current password, or set it to change it inline instead
// of using the separate reset-password action.
export const adminUpdateUserSchema = z
  .object({
    email: z.string().min(1, "Email is required").email("Enter a valid email"),
    role: z.enum(["ADMIN", "EDITOR"]),
    fullName: z.string().min(1, "Full name is required"),
    avatarUrl: z.string().optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    password: z.union([z.literal(""), passwordSchema]),
    permissions: z.array(z.enum(EDITOR_PERMISSION_VALUES)),
    fullDataAccess: z.array(z.enum(DATA_SCOPED_PERMISSION_VALUES)),
  })
  .refine((data) => data.fullDataAccess.every((key) => data.permissions.includes(key)), {
    message: "Full data access requires the matching module permission to be enabled.",
    path: ["fullDataAccess"],
  });
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;

export const adminUpdateUserRoleSchema = z.object({
  role: z.enum(["ADMIN", "EDITOR"]),
});
export type AdminUpdateUserRoleInput = z.infer<typeof adminUpdateUserRoleSchema>;

export const adminUpdateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]),
});
export type AdminUpdateUserStatusInput = z.infer<typeof adminUpdateUserStatusSchema>;

export const adminResetPasswordSchema = z.object({
  password: passwordSchema,
});
export type AdminResetPasswordInput = z.infer<typeof adminResetPasswordSchema>;
