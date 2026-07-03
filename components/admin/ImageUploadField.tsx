"use client";

import { useId, useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "@/components/ui/Toast";

type StorageProvider = "cloudinary" | "supabase";

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
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
  error?: string;
  aspectClassName?: string;
}) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [provider, setProvider] = useState<StorageProvider>("cloudinary");

  async function handleFile(file: File) {
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

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-brand-950">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>

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
          {value ? (
            <>
              <Image src={value} alt={label} fill sizes="128px" className="object-cover" />
              <button
                type="button"
                onClick={() => onChange("")}
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
            {isUploading ? "Uploading..." : value ? "Replace image" : "Upload image"}
          </button>
          <p className="mt-1 text-xs text-muted-400">PNG, JPG, WEBP, SVG or GIF, up to 5MB.</p>
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
