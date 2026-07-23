"use client";

import { useMemo, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "nextjs-toploader/app";
import { ArrowLeft } from "lucide-react";
import { adminEventSchema, type AdminEventInput } from "@/lib/validators/admin/event";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { ImageUploadField, type StorageProvider } from "@/components/admin/ImageUploadField";
import { ScrollableSingleSelectDropdown } from "@/components/admin/ScrollableSingleSelectDropdown";
import { ScrollableMultiSelectDropdown } from "@/components/admin/ScrollableMultiSelectDropdown";
import { slugify } from "@/lib/utils";
import { iconMap, renderCategoryIcon } from "@/lib/icons";
import type { Coupon, Event, Store } from "@/types";

const fieldClassName =
  "w-full rounded-lg border border-muted-300 bg-surface-0 px-4 py-2.5 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";

function requiredMark() {
  return <span className="text-red-600"> *</span>;
}

function toDateInput(iso?: string) {
  return iso ? iso.slice(0, 10) : "";
}

const iconOptions = [
  { value: "", label: "None" },
  ...Object.keys(iconMap).map((name) => ({ value: name, label: name })),
];

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
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [pendingBannerFile, setPendingBannerFile] = useState<File | null>(null);
  const [pendingBannerProvider, setPendingBannerProvider] = useState<StorageProvider>("cloudinary");
  const [pendingIconFile, setPendingIconFile] = useState<File | null>(null);
  const [pendingIconProvider, setPendingIconProvider] = useState<StorageProvider>("cloudinary");
  const [couponStoreFilter, setCouponStoreFilter] = useState("");

  const storeById = useMemo(() => new Map(stores.map((s) => [s.id, s])), [stores]);
  const eventStoreIds = useMemo(() => new Set(event?.featuredStoreIds ?? []), [event]);
  const showFeaturedCoupons = Boolean(event) && eventStoreIds.size > 0;
  const eventStores = useMemo(
    () => stores.filter((s) => eventStoreIds.has(s.id)),
    [stores, eventStoreIds]
  );
  const eventCoupons = useMemo(
    () => coupons.filter((c) => eventStoreIds.has(c.storeId)),
    [coupons, eventStoreIds]
  );
  const pickerCoupons = useMemo(
    () =>
      couponStoreFilter ? eventCoupons.filter((c) => c.storeId === couponStoreFilter) : eventCoupons,
    [eventCoupons, couponStoreFilter]
  );
  const storeFilterOptions = useMemo(
    () => [{ value: "", label: "All stores" }, ...eventStores.map((s) => ({ value: s.id, label: s.name }))],
    [eventStores]
  );
  const pickerCouponOptions = useMemo(
    () =>
      pickerCoupons.map((c) => ({
        value: c.id,
        label: c.exclusive ? `${c.title} (Exclusive)` : c.title,
      })),
    [pickerCoupons]
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
          iconName: event.iconName ?? "",
          iconImageUrl: event.iconImageUrl ?? "",
          description: event.description,
          bannerUrl: event.bannerUrl ?? "",
          startsAt: toDateInput(event.startsAt),
          endsAt: toDateInput(event.endsAt),
          featuredCouponIds: event.featuredCouponIds,
        }
      : {
          slug: "",
          name: "",
          iconName: "",
          iconImageUrl: "",
          description: "",
          bannerUrl: "",
          startsAt: "",
          endsAt: "",
          featuredCouponIds: [],
        },
  });

  const previewName = useWatch({ control, name: "name" }) || "Event";
  const previewIconName = useWatch({ control, name: "iconName" });
  const previewIconImageUrl = useWatch({ control, name: "iconImageUrl" });

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

  async function onSubmit(data: AdminEventInput) {
    try {
      const [bannerUrl, iconImageUrl] = await Promise.all([
        uploadIfPending(data.bannerUrl, pendingBannerFile, pendingBannerProvider, "banner"),
        uploadIfPending(data.iconImageUrl, pendingIconFile, pendingIconProvider, "icon image"),
      ]);
      if ((pendingBannerFile && bannerUrl === null) || (pendingIconFile && iconImageUrl === null)) {
        return;
      }

      const endpoint = event ? `/api/admin/events/${event.id}` : "/api/admin/events";
      const res = await fetch(endpoint, {
        method: event ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, bannerUrl, iconImageUrl }),
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
                  if (!event) {
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
              placeholder="e.g. black-friday"
              className={fieldClassName}
              {...register("slug")}
            />
            {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <span className="mb-1.5 block text-sm font-medium text-brand-950">
                Icon name <span className="text-muted-400">(optional, lucide-react)</span>
              </span>
              <Controller
                control={control}
                name="iconName"
                render={({ field }) => (
                  <ScrollableSingleSelectDropdown
                    options={iconOptions}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    searchable
                    searchPlaceholder="Search icons..."
                  />
                )}
              />
              {errors.iconName && (
                <p className="mt-1 text-xs text-red-600">{errors.iconName.message}</p>
              )}
            </div>

            <Controller
              control={control}
              name="iconImageUrl"
              render={({ field }) => (
                <ImageUploadField
                  label="Icon image"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  aspectClassName="aspect-square w-20"
                  error={errors.iconImageUrl?.message}
                  deferUpload
                  onFileSelected={(file, provider) => {
                    setPendingIconFile(file);
                    setPendingIconProvider(provider);
                  }}
                />
              )}
            />

            <div className="flex flex-col items-center gap-1.5">
              <span className="text-xs font-medium text-muted-500">Preview</span>
              <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg border border-muted-200 bg-brand-50 text-brand-600">
                {renderCategoryIcon(
                  { name: previewName, iconName: previewIconName, iconImageUrl: previewIconImageUrl },
                  { iconClassName: "h-5 w-5" }
                )}
              </span>
            </div>
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
                deferUpload
                onFileSelected={(file, provider) => {
                  setPendingBannerFile(file);
                  setPendingBannerProvider(provider);
                }}
              />
            )}
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="startsAt" className="mb-1.5 block text-sm font-medium text-brand-950">
                Starts At <span className="text-muted-400">(optional)</span>
              </label>
              <input id="startsAt" type="date" className={fieldClassName} {...register("startsAt")} />
              {errors.startsAt && <p className="mt-1 text-xs text-red-600">{errors.startsAt.message}</p>}
            </div>

            <div>
              <label htmlFor="endsAt" className="mb-1.5 block text-sm font-medium text-brand-950">
                Ends At <span className="text-muted-400">(optional)</span>
              </label>
              <input id="endsAt" type="date" className={fieldClassName} {...register("endsAt")} />
              {errors.endsAt && <p className="mt-1 text-xs text-red-600">{errors.endsAt.message}</p>}
            </div>
          </div>

          {showFeaturedCoupons && (
            <div>
              <span className="mb-1.5 block text-sm font-medium text-brand-950">
                Featured Coupons <span className="text-muted-400">(optional)</span>
              </span>
              <Controller
                control={control}
                name="featuredCouponIds"
                render={({ field }) => {
                  const selectedSet = new Set(field.value);
                  function toggle(couponId: string) {
                    field.onChange(
                      selectedSet.has(couponId)
                        ? field.value.filter((id) => id !== couponId)
                        : [...field.value, couponId]
                    );
                  }
                  const selectedCoupons = eventCoupons.filter((c) => selectedSet.has(c.id));

                  return (
                    <>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <span className="mb-1.5 block text-xs font-medium text-muted-500">
                            Filter by store
                          </span>
                          <ScrollableSingleSelectDropdown
                            options={storeFilterOptions}
                            value={couponStoreFilter}
                            onChange={setCouponStoreFilter}
                            searchable
                            searchPlaceholder="Search stores..."
                          />
                        </div>

                        <div>
                          <span className="mb-1.5 block text-xs font-medium text-muted-500">
                            Coupons
                          </span>
                          <ScrollableMultiSelectDropdown
                            options={pickerCouponOptions}
                            values={field.value}
                            onChange={field.onChange}
                            placeholder="Select coupons..."
                          />
                        </div>
                      </div>

                      <div className="mt-3">
                        <p className="text-xs font-medium text-muted-500">
                          Selected coupons ({selectedCoupons.length})
                        </p>
                        <div className="mt-1.5 space-y-1.5">
                          {selectedCoupons.map((coupon) => (
                            <div
                              key={coupon.id}
                              className="flex items-center justify-between gap-2 rounded-lg border border-muted-200 bg-surface-0 px-3 py-1.5 text-sm"
                            >
                              <span className="text-brand-950">
                                {storeById.get(coupon.storeId)?.name ?? "—"} — {coupon.title}
                                {coupon.exclusive && (
                                  <span className="ml-1.5 text-xs font-medium text-accent-700">
                                    (Exclusive)
                                  </span>
                                )}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggle(coupon.id)}
                                className="shrink-0 text-xs font-medium text-muted-500 hover:text-red-600"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                          {selectedCoupons.length === 0 && (
                            <p className="text-sm text-muted-400">No coupons selected yet.</p>
                          )}
                        </div>
                      </div>
                    </>
                  );
                }}
              />
            </div>
          )}

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
