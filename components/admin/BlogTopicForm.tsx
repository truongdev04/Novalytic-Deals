"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { adminBlogTopicSchema, type AdminBlogTopicInput } from "@/lib/validators/admin/blogTopic";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { slugify } from "@/lib/utils";
import type { BlogTopic } from "@/types";

const fieldClassName =
  "w-full rounded-lg border border-muted-300 bg-surface-0 px-4 py-2.5 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";

function requiredMark() {
  return <span className="text-red-600"> *</span>;
}

export function BlogTopicForm({ topic }: { topic?: BlogTopic }) {
  const router = useRouter();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AdminBlogTopicInput>({
    resolver: zodResolver(adminBlogTopicSchema),
    defaultValues: topic
      ? { slug: topic.slug, name: topic.name, description: topic.description ?? "" }
      : { slug: "", name: "", description: "" },
  });

  async function onSubmit(data: AdminBlogTopicInput) {
    try {
      const endpoint = topic ? `/api/admin/blog-topics/${topic.id}` : "/api/admin/blog-topics";
      const res = await fetch(endpoint, {
        method: topic ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const message = body?.error ?? "Failed to save topic.";
        if (message.toLowerCase().includes("slug")) {
          setError("slug", { message });
        }
        toast.error(message);
        return;
      }
      toast.success(topic ? "Topic updated." : "Topic created.");
      router.push("/admin/blog/topics");
      router.refresh();
    } catch {
      toast.error("Failed to save topic.");
    }
  }

  function handleBack() {
    if (isDirty) {
      setShowLeaveConfirm(true);
      return;
    }
    router.push("/admin/blog/topics");
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-brand-950">
                Name{requiredMark()}
              </label>
              <input
                id="name"
                placeholder="e.g. Tips & Tricks"
                className={fieldClassName}
                {...register("name", {
                  onChange: (e) => {
                    if (!topic) {
                      setValue("slug", slugify(e.target.value), {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }
                  },
                })}
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="slug" className="mb-1.5 block text-sm font-medium text-brand-950">
                Slug{requiredMark()}
              </label>
              <input
                id="slug"
                placeholder="e.g. tips-and-tricks"
                className={fieldClassName}
                {...register("slug")}
              />
              {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-brand-950">
              Description <span className="text-muted-400">(optional)</span>
            </label>
            <textarea id="description" rows={3} className={fieldClassName} {...register("description")} />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : topic ? "Update Topic" : "Create Topic"}
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
          <Button variant="primary" onClick={() => router.push("/admin/blog/topics")}>
            Discard changes
          </Button>
        </div>
      </Modal>
    </>
  );
}
