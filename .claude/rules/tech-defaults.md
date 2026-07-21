# Tech defaults

## Frontend

Next.js App Router · TypeScript strict · Tailwind · shadcn/ui · lucide-react · Framer Motion (nhẹ) · React Hook Form + Zod · `next/image` · `next/font` (Inter + Poppins).
Server Components mặc định; Client Components chỉ khi cần tương tác.

## Backend (đích)

Prisma + PostgreSQL (Supabase/Neon) · Redis Upstash (cache + rate limit) · NextAuth (admin) · Resend (email) · Meilisearch/Algolia (search khi cần) · Route Handlers `app/api/*`.

## Env vars

`.env.example` commit, `.env` bỏ qua:

```
DATABASE_URL= REDIS_URL=
NEXTAUTH_URL= NEXTAUTH_SECRET=
RESEND_API_KEY=
TURNSTILE_SITE_KEY= TURNSTILE_SECRET_KEY=
AFFILIATE_DEFAULT_NETWORK=
NEXT_PUBLIC_SITE_URL= NEXT_PUBLIC_GA_ID= NEXT_PUBLIC_PLAUSIBLE_DOMAIN=
```

Placeholder — thêm library-specific default khác (date lib, HTTP client convention) khi quyết định.
