import { z } from "zod";

const passwordSchema = z.string().min(8, "Password must be at least 8 characters");

export const adminCreateUserSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  role: z.enum(["ADMIN", "EDITOR"]),
  password: passwordSchema,
});
export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;

export const adminUpdateUserRoleSchema = z.object({
  role: z.enum(["ADMIN", "EDITOR"]),
});
export type AdminUpdateUserRoleInput = z.infer<typeof adminUpdateUserRoleSchema>;

export const adminResetPasswordSchema = z.object({
  password: passwordSchema,
});
export type AdminResetPasswordInput = z.infer<typeof adminResetPasswordSchema>;
