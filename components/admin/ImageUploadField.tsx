"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "@/components/ui/Toast";

export type StorageProvider = "cloudinary" | "supabase";

const PROVIDERS: { value: StorageProvider; label: string }[] = [
  { value: "cloudinary", label: "Cloudinary" },
  { value: "supabase", label: "Supabase Storage" },
];

export function ImageUploadField({
  label,
  value,
  onChange,
  required,
  error,
  aspectClassName = "aspect-square w-32",
  deferUpload = false,
  onFileSelected,
  allowManualUrl = false,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
  error?: string;
  aspectClassName?: string;
  /** When true, picking a file only stages it locally (preview) instead of
   * uploading immediately — the caller is responsible for uploading the
   * staged file (via `onFileSelected`) whenever it's ready to persist it
   * (e.g. on form submit). */
  deferUpload?: boolean;
  onFileSelected?: (file: File | null, provider: StorageProvider) => void;
  /** When true, also shows a plain text input so the value can be pasted in
   * directly (e.g. an external avatar URL) instead of only being set via
   * upload. */
  allowManualUrl?: boolean;
}) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [provider, setProvider] = useState<StorageProvider>("cloudinary");
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    };
  }, [pendingPreviewUrl]);

  async function handleFile(file: File) {
    if (deferUpload) {
      if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
      const previewUrl = URL.createObjectURL(file);
      setPendingPreviewUrl(previewUrl);
      onFileSelected?.(file, provider);
      // Populate the form field with a placeholder (non-empty) value so
      // required-field validation passes before the real upload happens —
      // the caller replaces it with the actual uploaded URL in onSubmit.
      onChange(previewUrl);
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("provider", provider);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.data?.url) {
        throw new Error(body?.error || "Upload failed");
      }
      onChange(body.data.url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  function handleRemove() {
    if (pendingPreviewUrl) {
      URL.revokeObjectURL(pendingPreviewUrl);
      setPendingPreviewUrl(null);
      onFileSelected?.(null, provider);
    }
    onChange("");
  }

  const displayUrl = pendingPreviewUrl ?? value;

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-brand-950">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>

      {allowManualUrl && (
        <input
          type="text"
          value={pendingPreviewUrl ? "" : value}
          onChange={(e) => {
            if (pendingPreviewUrl) {
              URL.revokeObjectURL(pendingPreviewUrl);
              setPendingPreviewUrl(null);
              onFileSelected?.(null, provider);
            }
            onChange(e.target.value);
          }}
          placeholder="Paste an image URL, or upload a file below..."
          className="mb-2 w-full rounded-lg border border-muted-300 bg-surface-0 px-4 py-2.5 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        />
      )}

      <div className="mb-2 flex items-center justify-start gap-2">
        <label htmlFor={`${inputId}-storage`} className="text-xs font-medium text-muted-600">
          Storage
        </label>
        <select
          id={`${inputId}-storage`}
          value={provider}
          onChange={(e) => setProvider(e.target.value as StorageProvider)}
          className="w-44 rounded-lg border border-muted-300 bg-surface-0 px-3 py-1.5 text-left text-xs text-brand-950 focus:border-brand-400 focus:outline-none"
        >
          {PROVIDERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-4">
        <div
          className={`relative overflow-hidden rounded-lg border border-dashed border-muted-300 bg-surface-100 ${aspectClassName}`}
        >
          {displayUrl ? (
            <>
              {pendingPreviewUrl || allowManualUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- local blob: preview or manually-pasted external URL, next/image can't optimize either
                <img src={displayUrl} alt={label} className="h-full w-full object-cover" />
              ) : (
                <Image src={displayUrl} alt={label} fill sizes="128px" className="object-cover" />
              )}
              <button
                type="button"
                onClick={handleRemove}
                aria-label={`Remove ${label}`}
                className="absolute right-1 top-1 rounded-full bg-brand-950/70 p-1 text-white hover:bg-brand-950"
              >
                <X className="h-3 w-3" />
              </button>
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-400">
              {isUploading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <ImagePlus className="h-6 w-6" />
              )}
            </div>
          )}
        </div>

        <div>
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="rounded-lg border border-muted-300 bg-surface-0 px-3 py-2 text-sm font-medium text-brand-950 hover:bg-surface-100 disabled:opacity-50"
          >
            {isUploading ? "Uploading..." : displayUrl ? "Replace image" : "Upload image"}
          </button>
          <p className="mt-1 text-xs text-muted-400">
            {deferUpload
              ? "PNG, JPG, WEBP, SVG or GIF, up to 5MB. Uploaded on save."
              : "PNG, JPG, WEBP, SVG or GIF, up to 5MB."}
          </p>
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
