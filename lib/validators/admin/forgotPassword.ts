import { z } from "zod";
import { passwordSchema } from "./user";

export const forgotPasswordRequestSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  turnstileToken: z.string().optional(),
});
export type ForgotPasswordRequestInput = z.infer<typeof forgotPasswordRequestSchema>;

export const forgotPasswordVerifySchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  code: z.string().length(6, "Enter the 6-digit code").regex(/^\d{6}$/, "Code must be numeric"),
});
export type ForgotPasswordVerifyInput = z.infer<typeof forgotPasswordVerifySchema>;

export const resetPasswordSchema = z.object({
  resetToken: z.string().min(1, "Missing reset token"),
  password: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// Client-side form schema only — confirmPassword is never sent to the server.
export const resetPasswordFormSchema = resetPasswordSchema
  .extend({ confirmPassword: z.string().min(1, "Please confirm your password") })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ResetPasswordFormInput = z.infer<typeof resetPasswordFormSchema>;
