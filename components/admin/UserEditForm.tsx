"use client";

import { useState } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import {
  adminUpdateUserSchema,
  EDITOR_PERMISSION_OPTIONS,
  type AdminUpdateUserInput,
} from "@/lib/validators/admin/user";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { ImageUploadField, type StorageProvider } from "@/components/admin/ImageUploadField";
import type { AdminUser } from "@/types";

const fieldClassName =
  "w-full rounded-lg border border-muted-300 bg-surface-0 px-4 py-2.5 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";

const BACK_HREF = "/admin/users";

function requiredMark() {
  return <span className="text-red-600"> *</span>;
}

export function UserEditForm({ user }: { user: AdminUser }) {
  const router = useRouter();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [pendingAvatarProvider, setPendingAvatarProvider] = useState<StorageProvider>("cloudinary");
  const [showPassword, setShowPassword] = useState(false);

  async function uploadPendingImage(file: File, provider: StorageProvider): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("provider", provider);
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.data?.url) {
      throw new Error(body?.error || "Image upload failed");
    }
    return body.data.url;
  }

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AdminUpdateUserInput>({
    resolver: zodResolver(adminUpdateUserSchema),
    defaultValues: {
      email: user.email,
      role: user.role,
      fullName: user.fullName ?? "",
      avatarUrl: user.avatarUrl ?? "",
      phone: user.phone ?? "",
      password: "",
      permissions: (user.permissions as AdminUpdateUserInput["permissions"]) ?? [],
    },
  });

  const role = useWatch({ control, name: "role" });

  async function onSubmit(data: AdminUpdateUserInput) {
    try {
      const avatarUrl = pendingAvatarFile
        ? await uploadPendingImage(pendingAvatarFile, pendingAvatarProvider)
        : data.avatarUrl;

      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, avatarUrl }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const message = body?.error ?? "Failed to update user.";
        if (message.toLowerCase().includes("email")) {
          setError("email", { message });
        }
        toast.error(message);
        return;
      }
      toast.success("User updated.");
      router.push(BACK_HREF);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update user.");
    }
  }

  function handleBack() {
    if (isDirty) {
      setShowLeaveConfirm(true);
      return;
    }
    router.push(BACK_HREF);
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-600 hover:bg-surface-100 hover:text-brand-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="mx-auto mt-6 w-full space-y-5 md:w-4/5">
          <Controller
            control={control}
            name="avatarUrl"
            render={({ field }) => (
              <ImageUploadField
                label="Avatar"
                value={field.value ?? ""}
                onChange={field.onChange}
                aspectClassName="aspect-square w-32"
                allowManualUrl
                deferUpload
                onFileSelected={(file, provider) => {
                  setPendingAvatarFile(file);
                  setPendingAvatarProvider(provider);
                }}
              />
            )}
          />

          <div>
            <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-brand-950">
              Full name{requiredMark()}
            </label>
            <input id="fullName" className={fieldClassName} {...register("fullName")} />
            {errors.fullName && (
              <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-brand-950">
              Email{requiredMark()}
            </label>
            <input id="email" type="email" className={fieldClassName} {...register("email")} />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-brand-950">
              Phone number
            </label>
            <input id="phone" type="tel" className={fieldClassName} {...register("phone")} />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-brand-950">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Leave blank to keep the current password"
                className={`${fieldClassName} pr-10`}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-500 hover:text-brand-900"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-brand-950">
              Role
            </label>
            <select id="role" className={fieldClassName} {...register("role")}>
              <option value="EDITOR">Editor</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {role === "EDITOR" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-950">
                Functional authorization
              </label>
              <p className="mb-2 text-xs text-muted-500">
                Choose which admin sections this editor can access.
              </p>
              <div className="grid grid-cols-1 gap-2 rounded-lg border border-muted-200 p-3 sm:grid-cols-2">
                {EDITOR_PERMISSION_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 text-sm text-brand-950"
                  >
                    <input
                      type="checkbox"
                      value={option.value}
                      className="h-4 w-4"
                      {...register("permissions")}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </div>
      </form>

      <Modal
        open={showLeaveConfirm}
        onOpenChange={setShowLeaveConfirm}
        title="Discard unsaved changes?"
      >
        <p className="text-sm text-muted-600">
          You have unsaved changes. If you leave now, they will be lost.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowLeaveConfirm(false)}>
            Keep editing
          </Button>
          <Button variant="primary" onClick={() => router.push(BACK_HREF)}>
            Discard changes
          </Button>
        </div>
      </Modal>
    </>
  );
}
