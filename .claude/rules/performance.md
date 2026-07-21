# Performance

- Core Web Vitals: LCP < 2.5s, INP < 200ms, CLS < 0.1.
- Server Components mặc định; audit `@next/bundle-analyzer`. `dynamic()` cho modal/share/MDX.
- `next/image` (width/height hoặc `fill+sizes`), `next/font` subset.
- ISR + `revalidateTag` (xem [backend-architecture.md](backend-architecture.md) mục "Caching"). Brotli edge.
