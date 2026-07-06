"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { adminBlogPostSchema, type AdminBlogPostInput } from "@/lib/validators/admin/blog";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { ImageUploadField, type StorageProvider } from "@/components/admin/ImageUploadField";
import { slugify } from "@/lib/utils";
import type { BlogPost, BlogTopic, Category } from "@/types";

const fieldClassName =
  "w-full rounded-lg border border-muted-300 bg-surface-0 px-4 py-2.5 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";

function requiredMark() {
  return <span className="text-red-600"> *</span>;
}

export function BlogForm({
  post,
  categories,
  topics,
}: {
  post?: BlogPost;
  categories: Category[];
  topics: BlogTopic[];
}) {
  const router = useRouter();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
  const [pendingCoverProvider, setPendingCoverProvider] = useState<StorageProvider>("cloudinary");
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [pendingAvatarProvider, setPendingAvatarProvider] = useState<StorageProvider>("cloudinary");

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AdminBlogPostInput>({
    resolver: zodResolver(adminBlogPostSchema),
    defaultValues: post
      ? {
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          coverImage: post.coverImage,
          authorName: post.authorName,
          authorAvatarUrl: post.authorAvatarUrl ?? "",
          tags: post.tags,
          categoryId: post.categoryId ?? "",
          topicId: post.topicId ?? "",
          body: post.body,
          readingMinutes: post.readingMinutes,
          publishedAt: post.publishedAt.slice(0, 10),
          isFeatured: post.isFeatured,
          isFirst: post.isFirst,
          seoTitle: post.seo.title,
          seoDescription: post.seo.description,
        }
      : {
          slug: "",
          title: "",
          excerpt: "",
          coverImage: "",
          authorName: "",
          authorAvatarUrl: "",
          tags: [],
          categoryId: "",
          topicId: "",
          body: "",
          readingMinutes: 1,
          publishedAt: "",
          isFeatured: false,
          isFirst: false,
          seoTitle: "",
          seoDescription: "",
        },
  });

  async function uploadIfPending(
    currentValue: string | undefined,
    file: File | null,
    provider: StorageProvider,
    label: string
  ): Promise<string | null> {
    if (!file) return currentValue ?? "";
    const formData = new FormData();
    formData.append("file", file);
    formData.append("provider", provider);
    const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const uploadBody = await uploadRes.json().catch(() => null);
    if (!uploadRes.ok || !uploadBody?.data?.url) {
      toast.error(uploadBody?.error || `Failed to upload ${label}.`);
      return null;
    }
    return uploadBody.data.url;
  }

  async function onSubmit(data: AdminBlogPostInput) {
    try {
      const [coverImage, authorAvatarUrl] = await Promise.all([
        uploadIfPending(data.coverImage, pendingCoverFile, pendingCoverProvider, "cover image"),
        uploadIfPending(data.authorAvatarUrl, pendingAvatarFile, pendingAvatarProvider, "author avatar"),
      ]);
      if ((pendingCoverFile && coverImage === null) || (pendingAvatarFile && authorAvatarUrl === null)) {
        return;
      }

      const endpoint = post ? `/api/admin/blog/${post.id}` : "/api/admin/blog";
      const res = await fetch(endpoint, {
        method: post ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, coverImage, authorAvatarUrl }),
      });
      if (!res.ok) throw new Error("save failed");
      toast.success(post ? "Blog post updated." : "Blog post created.");
      router.push("/admin/blog");
      router.refresh();
    } catch {
      toast.error("Failed to save blog post.");
    }
  }

  function handleBack() {
    if (isDirty) {
      setShowLeaveConfirm(true);
      return;
    }
    router.push("/admin/blog");
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
          <div>
            <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-brand-950">
              Title{requiredMark()}
            </label>
            <input
              id="title"
              placeholder="e.g. 10 Ways to Save on Back-to-School Shopping"
              className={fieldClassName}
              {...register("title", {
                onChange: (e) => {
                  if (!post) {
                    setValue("slug", slugify(e.target.value), {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }
                },
              })}
            />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
          </div>

          <div>
            <label htmlFor="slug" className="mb-1.5 block text-sm font-medium text-brand-950">
              Slug{requiredMark()}
            </label>
            <input
              id="slug"
              placeholder="e.g. save-on-back-to-school-shopping"
              className={fieldClassName}
              {...register("slug")}
            />
            {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>}
          </div>

          <div>
            <label htmlFor="excerpt" className="mb-1.5 block text-sm font-medium text-brand-950">
              Excerpt{requiredMark()}
            </label>
            <textarea id="excerpt" rows={2} className={fieldClassName} {...register("excerpt")} />
            {errors.excerpt && <p className="mt-1 text-xs text-red-600">{errors.excerpt.message}</p>}
          </div>

          <Controller
            control={control}
            name="coverImage"
            render={({ field }) => (
              <ImageUploadField
                label="Cover Image"
                required
                value={field.value}
                onChange={field.onChange}
                aspectClassName="aspect-video w-48"
                error={errors.coverImage?.message}
                deferUpload
                onFileSelected={(file, provider) => {
                  setPendingCoverFile(file);
                  setPendingCoverProvider(provider);
                }}
              />
            )}
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="authorName" className="mb-1.5 block text-sm font-medium text-brand-950">
                Author Name <span className="text-muted-400">(optional)</span>
              </label>
              <input
                id="authorName"
                placeholder="e.g. NovalyticDeals"
                className={fieldClassName}
                {...register("authorName")}
              />
              {errors.authorName && (
                <p className="mt-1 text-xs text-red-600">{errors.authorName.message}</p>
              )}
            </div>

            <Controller
              control={control}
              name="authorAvatarUrl"
              render={({ field }) => (
                <ImageUploadField
                  label="Author Avatar"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  aspectClassName="aspect-square w-20"
                  allowManualUrl
                  deferUpload
                  onFileSelected={(file, provider) => {
                    setPendingAvatarFile(file);
                    setPendingAvatarProvider(provider);
                  }}
                />
              )}
            />
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-brand-950">
              Category <span className="text-muted-400">(optional)</span>
            </span>
            <select className={fieldClassName} {...register("categoryId")}>
              <option value="">None</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-brand-950">
              Topic <span className="text-muted-400">(optional)</span>
            </span>
            <select className={fieldClassName} {...register("topicId")}>
              <option value="">None</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="body" className="mb-1.5 block text-sm font-medium text-brand-950">
              Body{requiredMark()}
            </label>
            <p className="mb-1.5 text-xs text-muted-400">
              Use <code>## Heading</code> lines with blank lines between paragraphs.
            </p>
            <textarea id="body" rows={16} className={fieldClassName} {...register("body")} />
            {errors.body && <p className="mt-1 text-xs text-red-600">{errors.body.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="readingMinutes"
                className="mb-1.5 block text-sm font-medium text-brand-950"
              >
                Reading Minutes{requiredMark()}
              </label>
              <input
                id="readingMinutes"
                type="number"
                min={1}
                className={fieldClassName}
                {...register("readingMinutes", { valueAsNumber: true })}
              />
              {errors.readingMinutes && (
                <p className="mt-1 text-xs text-red-600">{errors.readingMinutes.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="publishedAt"
                className="mb-1.5 block text-sm font-medium text-brand-950"
              >
                Published At{requiredMark()}
              </label>
              <input
                id="publishedAt"
                type="date"
                className={fieldClassName}
                {...register("publishedAt")}
              />
              {errors.publishedAt && (
                <p className="mt-1 text-xs text-red-600">{errors.publishedAt.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="seoTitle" className="mb-1.5 block text-sm font-medium text-brand-950">
              SEO Title{requiredMark()}
            </label>
            <input id="seoTitle" className={fieldClassName} {...register("seoTitle")} />
            {errors.seoTitle && <p className="mt-1 text-xs text-red-600">{errors.seoTitle.message}</p>}
          </div>

          <div>
            <label
              htmlFor="seoDescription"
              className="mb-1.5 block text-sm font-medium text-brand-950"
            >
              SEO Description{requiredMark()}
            </label>
            <textarea
              id="seoDescription"
              rows={3}
              className={fieldClassName}
              {...register("seoDescription")}
            />
            {errors.seoDescription && (
              <p className="mt-1 text-xs text-red-600">{errors.seoDescription.message}</p>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-brand-950">
            <input type="checkbox" className="h-4 w-4" {...register("isFeatured")} />
            Featured
          </label>

          <label className="flex items-center gap-2 text-sm font-medium text-brand-950">
            <input type="checkbox" className="h-4 w-4" {...register("isFirst")} />
            First post
          </label>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : post ? "Update Post" : "Create Post"}
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
          <Button variant="primary" onClick={() => router.push("/admin/blog")}>
            Discard changes
          </Button>
        </div>
      </Modal>
    </>
  );
}
