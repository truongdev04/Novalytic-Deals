# Design rules

Design direction tổng thể xem "Tổng quan" trong ../../CLAUDE.md (modern, professional, clean, premium; primary green, accent orange/yellow).

## Colors

Token trong `tailwind.config.ts` (`brand.*`, `accent.*`, `surface.*`, `muted.*`) — không hardcode hex.

## Typography

Inter (body), Poppins (heading), qua `next/font`. Contrast đạt WCAG AA.

## Radius & shadow

- `rounded-lg` card, `rounded-xl` hero, `rounded-full` pill.
- Shadow `sm` → `md` khi hover.

## Motion

- 150–250ms, easing `ease-out`.
- Tôn trọng `prefers-reduced-motion`.

Placeholder cho chi tiết sâu hơn (spacing scale, breakpoints) — thêm khi cần.
