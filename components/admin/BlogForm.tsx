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
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { slugify } from "@/lib/utils";
import type { BlogAuthor, BlogPost, Category } from "@/types";

const fieldClassName =
  "w-full rounded-lg border border-muted-300 bg-surface-0 px-4 py-2.5 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";

function requiredMark() {
  return <span className="text-red-600"> *</span>;
}

export function BlogForm({
  post,
  authors,
  categories,
}: {
  post?: BlogPost;
  authors: BlogAuthor[];
  categories: Category[];
}) {
  const router = useRouter();
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

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
          authorId: post.author.id,
          tags: post.tags.join(", "),
          categoryId: post.categoryId ?? "",
          body: post.body,
          readingMinutes: post.readingMinutes,
          publishedAt: post.publishedAt.slice(0, 10),
          isFeatured: post.isFeatured,
          seoTitle: post.seo.title,
          seoDescription: post.seo.description,
        }
      : {
          slug: "",
          title: "",
          excerpt: "",
          coverImage: "",
          authorId: "",
          tags: "",
          categoryId: "",
          body: "",
          readingMinutes: 1,
          publishedAt: "",
          isFeatured: false,
          seoTitle: "",
          seoDescription: "",
        },
  });

  async function onSubmit(data: AdminBlogPostInput) {
    try {
      const endpoint = post ? `/api/admin/blog/${post.id}` : "/api/admin/blog";
      const res = await fetch(endpoint, {
        method: post ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
                  if (!slugTouched) setValue("slug", slugify(e.target.value), { shouldDirty: true });
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
              {...register("slug", { onChange: () => setSlugTouched(true) })}
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
              />
            )}
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <span className="mb-1.5 block text-sm font-medium text-brand-950">
                Author{requiredMark()}
              </span>
              <select className={fieldClassName} {...register("authorId")}>
                <option value="">Select an author...</option>
                {authors.map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.name}
                  </option>
                ))}
              </select>
              {errors.authorId && <p className="mt-1 text-xs text-red-600">{errors.authorId.message}</p>}
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
          </div>

          <div>
            <label htmlFor="tags" className="mb-1.5 block text-sm font-medium text-brand-950">
              Tags <span className="text-muted-400">(comma-separated, optional)</span>
            </label>
            <input
              id="tags"
              placeholder="e.g. shopping, back-to-school, tips"
              className={fieldClassName}
              {...register("tags")}
            />
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
