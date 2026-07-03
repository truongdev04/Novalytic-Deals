---
name: image-upload-field
description: Add a real "upload from device" image field (with a per-field storage-provider picker: Cloudinary default, Supabase Storage alternate) anywhere in the admin, reusing the pipeline built for Store Logo/Banner.
---

Use this when a form needs a genuine file-upload field (not a paste-a-URL
input) — e.g. a new admin entity that needs a logo/cover image. The
pipeline below is already generic; adding a field to a new form usually
needs zero changes to the upload route or storage helpers.

## Pieces already built (reuse, don't duplicate)

- `components/admin/ImageUploadField.tsx` — client component. Renders a
  preview box (existing image + "X" remove button, or an upload-icon
  placeholder), a "Storage" `<select>` above it (Cloudinary / Supabase
  Storage, defaults to Cloudinary), and an "Upload image" / "Replace
  image" button that opens a hidden `<input type="file">` (accepts
  png/jpeg/webp/svg/gif). On file select it POSTs `FormData` (`file` +
  `provider`) to `/api/admin/upload` and calls `onChange(url)` with the
  returned URL, or `toast.error(...)` on failure.
- `app/api/admin/upload/route.ts` — validates file presence, MIME
  allow-list, and a 5MB cap; reads optional `provider` (default
  `"cloudinary"`) and `format` fields from the FormData; checks the
  chosen provider is configured before uploading (returns
  `jsonError(500, "... isn't configured. Set ...")` otherwise); generates
  a `stores/${crypto.randomUUID()}.${ext}` path; delegates to the
  provider helper; returns `{ url }`. Already covered by the existing
  `/api/admin/:path*` auth matcher in `proxy.ts` — no extra guard needed.
- `lib/server/storage/cloudinaryStorage.ts` — `uploadToCloudinary(path, file, { format? })`
  via the `cloudinary` SDK (base64 data-URI upload, `overwrite: true`,
  optional `format` e.g. `"webp"` for conversion), plus
  `isCloudinaryConfigured()`.
- `lib/server/storage/supabaseStorage.ts` — `uploadPublicFile(path, file)`
  via `@supabase/supabase-js`'s service-role client against the public
  bucket `store-assets`, plus `isStorageConfigured()`.
- `next.config.ts` — `images.remotePatterns` already allow-lists
  `*.supabase.co` (`/storage/v1/object/public/**`) and `res.cloudinary.com`
  (`/**`) so `next/image` can render uploaded URLs; CSP `img-src` already
  includes both hosts.

## Add a new upload field to a form

1. In the Zod schema for that form, the field is just a `z.string()` URL
   (same as `logoUrl`/`bannerUrl` in `lib/validators/admin/store.ts`).
2. In the form component, wrap it in a `Controller` and render
   `<ImageUploadField>`:
   ```tsx
   <Controller
     control={control}
     name="logoUrl"
     render={({ field }) => (
       <ImageUploadField
         label="Logo"
         required
         value={field.value}
         onChange={field.onChange}
         error={errors.logoUrl?.message}
       />
     )}
   />
   ```
   Pass `aspectClassName` to change the preview box shape (e.g.
   `"aspect-video w-48"` for a banner vs. the default
   `"aspect-square w-32"`).
3. Nothing else to wire — the route/helpers are already generic per-file,
   not per-entity.

## Add a new storage provider

1. `lib/server/storage/xStorage.ts` — new file with the same shape as the
   two existing helpers: `isXConfigured()` (checks its env vars) and
   `uploadX(path, file, options?)` returning the public URL string.
2. `app/api/admin/upload/route.ts` — add `"x"` to the `PROVIDERS` const
   array, add an `isXConfigured()` check + error message, add a branch in
   the `provider === "x" ? ... : ...` upload call.
3. `components/admin/ImageUploadField.tsx` — add `{ value: "x", label: "X" }`
   to the `PROVIDERS` array (order controls the `<select>` order; first
   entry is the default).
4. `next.config.ts` — add the new host to both `images.remotePatterns`
   and the CSP `img-src` list.

## Env vars / setup checklist

Already added to `.env.example` and (locally) `.env`:
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```
- Supabase: create a **public** bucket named `store-assets` in the
  Supabase dashboard (Storage tab) before `SUPABASE_SERVICE_ROLE_KEY`
  uploads will work.
- Cloudinary: copy `cloud_name` / `api_key` / `api_secret` from the
  dashboard's "API Environment variable" section.
- Until an env var set is filled in, that provider's uploads fail with a
  clear toast error instead of crashing — this is intentional
  graceful-degrade, matching how Turnstile/Upstash/Resend behave
  elsewhere in this repo.

## Verify

1. Leave one provider's env vars unset, pick it in the "Storage" select,
   try uploading — confirm a clear toast error, not a silent failure or
   crash.
2. Pick the configured provider, upload a real image, confirm the
   preview renders (proves `next.config.ts` remotePatterns/CSP are
   correct for that host) and the field's form value is the returned
   URL.
3. `npm run typecheck && npm run lint` should stay clean.
