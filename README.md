This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Local development database

`.env` points at the production Supabase database — don't run against it locally. Instead, spin up a local Postgres via Docker:

```bash
npm run db:up       # start local Postgres (docker compose), port 5434
npm run db:migrate   # apply Prisma migrations
npm run db:seed      # load mock data (data/*.json) + a local admin user
npm run dev           # http://localhost:3000, now reading from the local DB
```

`.env.local` (gitignored) holds the local `DATABASE_URL`/`DIRECT_URL` and overrides `.env` for `next dev`/`next start` and for the `db:*` scripts — everything else (Cloudinary, Resend, etc.) still falls back to `.env`. Log into `/admin` with the `ADMIN_SEED_EMAIL`/`ADMIN_SEED_PASSWORD` set in `.env.local`.

Other useful commands: `npm run db:studio` (browse data), `npm run db:down` (stop the container).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
