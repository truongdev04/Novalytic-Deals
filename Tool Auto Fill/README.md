# Store & Coupon Auto Fill Tool

Tool nội bộ, chạy hoàn toàn trong trình duyệt (không server, không build step). Chuẩn hoá sheet Store/Coupon thô (gộp theo store, discount viết tự do) thành file Excel sạch, sẵn sàng import — và có thể nhờ AI tự viết `description` + `about_store` riêng cho từng store.

**Độc lập hoàn toàn**: không phụ thuộc code Next.js/npm nào của dự án chứa nó. Chỉ cần trình duyệt + internet (script `xlsx` load qua CDN cdnjs, gọi thẳng API các AI provider từ client). Có thể copy nguyên folder này sang máy/dự án khác mà không cần chỉnh sửa gì.

## Cách dùng

- **`single-file/store-coupon-normalizer.html`** — 1 file duy nhất, double-click mở thẳng bằng trình duyệt.
- **`landing/index.html`** — bản có hero/step-by-step, tách riêng `css/styles.css` + `js/app.js`, cũng mở được bằng double-click.

**Chỉ chuẩn hoá dữ liệu + tải Excel (không dùng AI)** — double-click mở trực tiếp qua `file://` là đủ cho cả 2 biến thể, không cần localhost. Phần này chỉ là JS xử lý dữ liệu cục bộ + load thư viện `xlsx` qua CDN, trình duyệt không chặn việc này qua `file://`.

**Có dùng tính năng AI** (gọi OpenAI/Anthropic/Gemini/OpenRouter) — nên serve qua local server thay vì double-click, cho cả 2 biến thể:
```
cd "single-file" && python3 -m http.server 8000
# hoặc: cd "landing" && python3 -m http.server 8000
# rồi mở http://localhost:8000
```
Lý do: mở qua `file://` khiến trình duyệt gửi `Origin: null` trong mọi request `fetch()`; một số API (đặc biệt Anthropic, vốn cần header riêng `anthropic-dangerous-direct-browser-access` mới cho gọi từ browser) có thể xử lý `Origin: null` không nhất quán hoặc từ chối tuỳ CORS phía server. Rủi ro này **chưa được kiểm chứng thực tế** (chưa test với API key thật) — dùng localhost là lựa chọn an toàn hơn khi không chắc.

Quy trình: Upload file `.xlsx/.csv` hoặc dán dữ liệu từ Google Sheets → "Chuẩn hóa" → (tuỳ chọn) chọn AI provider + "Viết cho tất cả store" → "Tải Excel sạch (.xlsx)".

## Schema Excel output — QUAN TRỌNG nếu tách khỏi repo NovalticDeals

File Excel xuất ra gồm 3 sheet, đúng theo schema mà tính năng admin **"Auto Fill Store"** của NovalticDeals (`components/admin/AutoFillStoreButton.tsx` + `lib/parseAutoFillWorkbook.ts` + `app/api/admin/auto-fill-store/{parse,import}/route.ts`) mong đợi để import trực tiếp:

**Sheet `Stores`**: `name, link_website, link_affiliate, description, about_store`

**Sheet `Coupons`**: `store_name, title, type, code, discount_type, discount_value, currency, link_affiliate, exclusive`
- `type`: `CODE` | `DEAL` | `FREESHIP`
- `discount_type`: `PERCENT` | `AMOUNT` | `OTHER`
- `currency`: chỉ điền khi `discount_type = AMOUNT` (`$`, `€`, `£`)
- `exclusive`: `TRUE` chỉ ở coupon đầu tiên của mỗi store, còn lại `FALSE`

**Sheet `Review`**: `row, store, issue` — các dòng cần người kiểm tra lại thủ công.

⚠️ Đây là "hợp đồng" schema duy nhất giữa tool này và admin dashboard. Một khi tool bị tách hẳn khỏi repo NovalticDeals, nó **không còn tự động đồng bộ** nếu phía admin đổi field. Trước khi dùng lại sau một thời gian dài, nên đối chiếu lại `RawStoreRow`/`RawCouponRow` trong `lib/parseAutoFillWorkbook.ts` của repo NovalticDeals để chắc schema còn khớp.

## Tính năng AI (tuỳ chọn)

- 4 provider: **OpenAI**, **Anthropic Claude**, **Google Gemini**, **OpenRouter** — mỗi provider nhập/lưu API key riêng (`localStorage`, không gửi đi đâu khác ngoài chính provider đó).
- Model mặc định Gemini hiện là `gemini-3.5-flash` (chỉnh trực tiếp trong ô Model nếu cần đổi).
- **Fallback chain**: checkbox "Tự động chuyển provider/model khác khi gặp lỗi" (mặc định bật) + textarea liệt kê các dòng `provider:model` dự phòng — tool tự thử lần lượt khi gặp lỗi (rate limit, quá tải...), chỉ dùng provider nào đã có key lưu sẵn.
- Danh sách model free (Gemini flash-family, OpenRouter `:free`) trong textarea là seed "best effort" — kiểm tra lại qua link "Xem danh sách model" cạnh mỗi provider trước khi tin tưởng, vì model free hay đổi theo thời gian.
