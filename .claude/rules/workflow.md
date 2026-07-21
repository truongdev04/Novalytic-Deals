# Workflow rules

## Code conventions

- TS strict, không implicit `any`, không `@ts-ignore` thiếu lý do.
- Page mỏng: route + fetch qua repo + compose component.
- Không hardcode content — luôn qua `lib/data/*`.
- Named export, một component / file, filename khớp export.
- Zod schema trong `lib/validators/` dùng chung cho API + form.
- Commit theo Conventional Commits.

## Khi phân vân

- Ưu tiên pattern Next.js chuẩn hơn là "thông minh".
- Đổi UI kéo theo đổi shape data → sửa `types/` + repo TRƯỚC, UI sau.
- Sắp hardcode content → dừng, chuyển vào mock/repo.
- Trang mới → luôn kèm `generateMetadata` + JSON-LD phù hợp.

Placeholder — thêm chi tiết branching/review process khi quyết định.
