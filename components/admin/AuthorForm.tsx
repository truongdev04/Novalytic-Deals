"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "nextjs-toploader/app";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { ImageUploadField, type StorageProvider } from "@/components/admin/ImageUploadField";
import {
  adminAuthorFieldsSchema,
  type AdminAuthorFieldsInput,
} from "@/lib/validators/admin/settings";
import type { Author } from "@/types";

const fieldClassName =
  "w-full rounded-lg border border-muted-300 bg-surface-0 px-4 py-2.5 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";

const BACK_HREF = "/admin/settings/author";

export function AuthorForm({ author }: { author?: Author }) {
  const router = useRouter();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [pendingAvatarProvider, setPendingAvatarProvider] = useState<StorageProvider>("cloudinary");

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
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AdminAuthorFieldsInput>({
    resolver: zodResolver(adminAuthorFieldsSchema),
    defaultValues: author
      ? {
          name: author.name,
          avatarUrl: author.avatarUrl ?? "",
          jobTitle: author.jobTitle ?? "",
          bio: author.bio ?? "",
          isDefault: author.isDefault,
        }
      : {
          name: "",
          avatarUrl: "",
          jobTitle: "",
          bio: "",
          isDefault: false,
        },
  });

  async function onSubmit(data: AdminAuthorFieldsInput) {
    try {
      const avatarUrl = pendingAvatarFile
        ? await uploadPendingImage(pendingAvatarFile, pendingAvatarProvider)
        : data.avatarUrl;

      const endpoint = author
        ? `/api/admin/settings/author/${author.id}`
        : "/api/admin/settings/author";
      const res = await fetch(endpoint, {
        method: author ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, avatarUrl }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to save author.");
      }
      toast.success(author ? "Author updated." : "Author created.");
      router.push(BACK_HREF);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save author.");
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
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-brand-950">
              Name
            </label>
            <input id="name" className={fieldClassName} {...register("name")} />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="jobTitle" className="mb-1.5 block text-sm font-medium text-brand-950">
              Job title
            </label>
            <input id="jobTitle" className={fieldClassName} {...register("jobTitle")} />
          </div>

          <div>
            <label htmlFor="bio" className="mb-1.5 block text-sm font-medium text-brand-950">
              Bio
            </label>
            <textarea id="bio" rows={4} className={fieldClassName} {...register("bio")} />
            <p className="mt-1 text-xs text-muted-500">
              Used as the default author for new blog posts and as a fallback when a post has no
              author set.
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-brand-950">
            <input type="checkbox" className="h-4 w-4" {...register("isDefault")} />
            Set as default author
          </label>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : author ? "Update Author" : "Create Author"}
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
