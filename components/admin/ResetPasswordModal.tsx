"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  adminResetPasswordSchema,
  type AdminResetPasswordInput,
} from "@/lib/validators/admin/user";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import type { AdminUser } from "@/types";

const fieldClassName =
  "w-full rounded-lg border border-muted-300 bg-surface-0 px-4 py-2.5 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";

export function ResetPasswordModal({
  user,
  onOpenChange,
}: {
  user: AdminUser | null;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdminResetPasswordInput>({
    resolver: zodResolver(adminResetPasswordSchema),
    defaultValues: { password: "" },
  });

  async function onSubmit(data: AdminResetPasswordInput) {
    if (!user) return;
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to reset password.");
      toast.success(`Password reset for ${user.email}.`);
      reset();
      onOpenChange(false);
    } catch {
      toast.error("Failed to reset password.");
    }
  }

  return (
    <Modal
      open={user !== null}
      onOpenChange={(open) => {
        if (!open) reset();
        onOpenChange(open);
      }}
      title={user ? `Reset password for ${user.email}` : "Reset password"}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-brand-950">
            New password
          </label>
          <input
            id="password"
            type="password"
            className={fieldClassName}
            {...register("password")}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Reset password"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
