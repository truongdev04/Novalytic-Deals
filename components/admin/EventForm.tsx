"use client";

import { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { adminEventSchema, type AdminEventInput } from "@/lib/validators/admin/event";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { MultiSelectDropdown } from "@/components/admin/MultiSelectDropdown";
import { slugify } from "@/lib/utils";
import type { Coupon, Event, Store } from "@/types";

const fieldClassName =
  "w-full rounded-lg border border-muted-300 bg-surface-0 px-4 py-2.5 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";

function requiredMark() {
  return <span className="text-red-600"> *</span>;
}

function toDateInput(iso?: string) {
  return iso ? iso.slice(0, 10) : "";
}

export function EventForm({
  event,
  stores,
  coupons,
}: {
  event?: Event;
  stores: Store[];
  coupons: Coupon[];
}) {
  const router = useRouter();
  const [slugTouched, setSlugTouched] = useState(Boolean(event));
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const storeById = useMemo(() => new Map(stores.map((s) => [s.id, s])), [stores]);
  const storeOptions = useMemo(
    () => stores.map((s) => ({ value: s.id, label: s.name })),
    [stores]
  );
  const couponOptions = useMemo(
    () =>
      coupons.map((c) => ({
        value: c.id,
        label: `${storeById.get(c.storeId)?.name ?? "—"} — ${c.title}`,
      })),
    [coupons, storeById]
  );

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AdminEventInput>({
    resolver: zodResolver(adminEventSchema),
    defaultValues: event
      ? {
          slug: event.slug,
          name: event.name,
          iconName: event.iconName,
          description: event.description,
          bannerUrl: event.bannerUrl ?? "",
          startsAt: toDateInput(event.startsAt),
          endsAt: toDateInput(event.endsAt),
          featuredStoreIds: event.featuredStoreIds,
          featuredCouponIds: event.featuredCouponIds,
        }
      : {
          slug: "",
          name: "",
          iconName: "",
          description: "",
          bannerUrl: "",
          startsAt: "",
          endsAt: "",
          featuredStoreIds: [],
          featuredCouponIds: [],
        },
  });

  async function onSubmit(data: AdminEventInput) {
    try {
      const endpoint = event ? `/api/admin/events/${event.id}` : "/api/admin/events";
      const res = await fetch(endpoint, {
        method: event ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("save failed");
      toast.success(event ? "Event updated." : "Event created.");
      router.push("/admin/events");
      router.refresh();
    } catch {
      toast.error("Failed to save event.");
    }
  }

  function handleBack() {
    if (isDirty) {
      setShowLeaveConfirm(true);
      return;
    }
    router.push("/admin/events");
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
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-brand-950">
              Name{requiredMark()}
            </label>
            <input
              id="name"
              placeholder="e.g. Black Friday"
              className={fieldClassName}
              {...register("name", {
                onChange: (e) => {
                  if (!slugTouched) setValue("slug", slugify(e.target.value), { shouldDirty: true });
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
              placeholder="e.g. black-friday"
              className={fieldClassName}
              {...register("slug", { onChange: () => setSlugTouched(true) })}
            />
            {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>}
          </div>

          <div>
            <label htmlFor="iconName" className="mb-1.5 block text-sm font-medium text-brand-950">
              Icon name <span className="text-muted-400">(lucide-react icon name)</span>
              {requiredMark()}
            </label>
            <input id="iconName" placeholder="e.g. Tag" className={fieldClassName} {...register("iconName")} />
            {errors.iconName && <p className="mt-1 text-xs text-red-600">{errors.iconName.message}</p>}
          </div>

          <div>
            <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-brand-950">
              Description{requiredMark()}
            </label>
            <textarea id="description" rows={3} className={fieldClassName} {...register("description")} />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
            )}
          </div>

          <Controller
            control={control}
            name="bannerUrl"
            render={({ field }) => (
              <ImageUploadField
                label="Banner"
                value={field.value ?? ""}
                onChange={field.onChange}
                aspectClassName="aspect-video w-48"
              />
            )}
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="startsAt" className="mb-1.5 block text-sm font-medium text-brand-950">
                Starts At{requiredMark()}
              </label>
              <input id="startsAt" type="date" className={fieldClassName} {...register("startsAt")} />
              {errors.startsAt && <p className="mt-1 text-xs text-red-600">{errors.startsAt.message}</p>}
            </div>

            <div>
              <label htmlFor="endsAt" className="mb-1.5 block text-sm font-medium text-brand-950">
                Ends At{requiredMark()}
              </label>
              <input id="endsAt" type="date" className={fieldClassName} {...register("endsAt")} />
              {errors.endsAt && <p className="mt-1 text-xs text-red-600">{errors.endsAt.message}</p>}
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-brand-950">
              Featured Stores <span className="text-muted-400">(optional)</span>
            </span>
            <p className="mb-1.5 text-xs text-muted-400">
              A store belongs to at most one event — picking it here moves it out of any
              other event it&rsquo;s currently featured in.
            </p>
            <Controller
              control={control}
              name="featuredStoreIds"
              render={({ field }) => (
                <MultiSelectDropdown
                  options={storeOptions}
                  values={field.value}
                  onChange={field.onChange}
                  placeholder="Select stores..."
                />
              )}
            />
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-brand-950">
              Featured Coupons <span className="text-muted-400">(optional)</span>
            </span>
            <Controller
              control={control}
              name="featuredCouponIds"
              render={({ field }) => (
                <MultiSelectDropdown
                  options={couponOptions}
                  values={field.value}
                  onChange={field.onChange}
                  placeholder="Select coupons..."
                />
              )}
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : event ? "Update Event" : "Create Event"}
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
          <Button variant="primary" onClick={() => router.push("/admin/events")}>
            Discard changes
          </Button>
        </div>
      </Modal>
    </>
  );
}
