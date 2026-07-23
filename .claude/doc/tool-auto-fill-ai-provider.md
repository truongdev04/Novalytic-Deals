# Tool Auto Fill — Multi-provider AI + Fallback Chain + Đóng gói

## 1. Mục tiêu

Nâng cấp tool nội bộ `Tool Auto Fill/` (chuẩn hóa store/coupon từ sheet thô sang Excel sạch) để hỗ trợ nhiều AI provider, tự động rotate khi bị rate limit, cải thiện chất lượng prompt sinh nội dung SEO cho từng store, và đóng gói thành package độc lập sẵn sàng tách khỏi repo NovalticDeals.

## 2. Những phần đã hoàn thành

### Cấu trúc file hiện tại
- `Tool Auto Fill/single-file/store-coupon-normalizer.html` — bản redesign theo brand NovalyticDeals (màu `--brand-*`/`--accent-*` lấy từ `app/globals.css`, font Inter/Poppins), gộp 1 file.
- `Tool Auto Fill/landing/` (`index.html` + `css/styles.css` + `js/app.js`) — bản landing nhiều section (hero, step-by-step, tool), logic JS giống hệt bản single-file.
- `Tool Auto Fill/README.md` — tài liệu đầy đủ: tool làm gì, cách dùng 2 biến thể, schema Excel output chi tiết, tính năng AI/fallback chain.
- `Tool Auto Fill/run.md` — cheat sheet cách chạy: không cần npm/build; chuẩn hoá thuần (không AI) mở `file://` trực tiếp được; dùng AI nên chạy qua `python3 -m http.server 8000` (tránh rủi ro `Origin: null`); lệnh kill server.
- Bản gốc `Tool Auto Fill/store-coupon-normalizer.html` (OpenAI-only, model hardcode) **đã bị xoá** khỏi folder (ngoài phiên làm việc, không phải do tôi xoá) — hiện chỉ còn `single-file/` và `landing/`, cả 2 đều multi-provider.

### Schema Excel xuất ra (`normalize()`)
- **Stores**: `name, link_website, link_affiliate, description, about_store` (`link_website` = `link_affiliate` = giá trị cột "Link Affiliate" nguồn).
- **Coupons**: `store_name, title, type(CODE|DEAL|FREESHIP), code, discount_type(PERCENT|AMOUNT|OTHER), discount_value, currency($/€/£, chỉ khi AMOUNT), link_affiliate(kế thừa từ store), exclusive(TRUE chỉ ở coupon đầu tiên của mỗi store)`.
- Parser hỗ trợ currency `$`, `€`, `£` cả 2 chiều (`10€` / `€10`).
- **Quan trọng**: schema này khớp chính xác với những gì tính năng admin "Auto Fill Store" của NovalticDeals (`lib/parseAutoFillWorkbook.ts`) mong đợi để import trực tiếp — đây là "hợp đồng" duy nhất giữa tool và app chính, đã ghi lại trong `README.md` để không mất khi tool bị tách khỏi repo.

### Multi-provider AI (single-file + landing)
- `PROVIDERS` object: `openai`, `anthropic`, `gemini`, `openrouter` — mỗi provider có `label`, `defaultModel`, `keyName` (localStorage riêng), `keyLabel`, `modelsUrl`, `note`, `async call(key, model, prompt)`.
- UI: dropdown chọn provider, input Model (auto-fill default, editable), input API key (password, lưu riêng theo provider), link "Xem danh sách model" (đổi theo provider).
- Default model Gemini hiện là `gemini-3.5-flash`.

### Fallback chain (tự động đổi provider/model khi lỗi)
- Checkbox `#autoSwitch` (mặc định BẬT) + textarea `#fallbackChain` (mỗi dòng `provider:model`, seed mặc định gồm 3 model Gemini + 3 model free OpenRouter), persist qua `localStorage` (`novaltic_autoswitch`, `novaltic_fallback_chain`).
- `buildAttemptChain()`: vị trí #0 luôn là lựa chọn tay hiện tại; dòng fallback chỉ thêm nếu provider đó **đã có key lưu sẵn**; parse tách ở dấu `:` đầu tiên (an toàn với model id kiểu `google/gemini-2.0-flash-exp:free`); bỏ qua dòng trùng.
- Vòng lặp `genAI.onclick`: mỗi store thử `chain[chainPos]`; lỗi (bất kỳ loại) → `chainPos++`, thử lại **cùng store** với attempt kế tiếp; `chainPos` không reset giữa các store, không wraparound; hết chain mới dừng batch. Tắt checkbox → hành vi y hệt cũ.
- Gemini free tier tính quota riêng theo từng model (rotate hiệu quả); OpenRouter free tính theo tài khoản/key (rotate model trong OpenRouter chưa chắc né được limit, chỉ hữu ích như danh tính fallback riêng).

### UX nhỏ khác
- Upload file: tên file hiển thị ngay trong khung dashed (`#dropTitle`/`#dropHint`) kèm trạng thái `.filled`.
- Độ rộng cột bảng preview: Store `name/description/about_store` và Coupon `store_name/title` set `min-width` qua CSS `nth-child`.

### Prompt SEO (`buildPrompt(storeName, titles, websiteUrl)`)
- Dịch/thích nghi từ file `prompt-seo.txt` người dùng cung cấp: style copywriter SEO tiếng Anh, nguyên tắc E-E-A-T, tránh từ marketing thổi phồng, không bịa thông tin ngoài dữ liệu có.
- `description`: 1-2 câu, 20-40 từ. `about_store`: **đúng 4 đoạn**, 150-300 từ (giới thiệu → sản phẩm/tính năng → trải nghiệm mua sắm → tóm tắt trung lập), nối bằng `\n\n`.
- Nhúng nguyên văn ví dụ "SwissChems" (few-shot) — chỉ tham khảo tông giọng/cấu trúc, không copy nội dung.
- Output giữ JSON `{"description":"...","about_store":"..."}` để khớp `extractJSON()`.

## 3. Trạng thái hiện tại

- `single-file/store-coupon-normalizer.html` và `landing/js/app.js` pass `node --check` sau mọi lần sửa.
- Đã test độc lập bằng Node: `normalize()` (gồm case `$`/`€`) đúng schema; `buildAttemptChain()`/`parseFallbackLine()` đúng 4 case; `buildPrompt()` render không lỗi template literal.
- Đã khởi động thử local server (`python3 -m http.server 8000` tại `Tool Auto Fill/`) — load trang thành công (HTTP 200), đã kill sau khi test xong.
- **Chưa test end-to-end với API key thật** — chưa xác nhận: (a) API có chấp nhận `Origin: null` khi mở qua `file://`, (b) model `gemini-3.5-flash` và các model free OpenRouter trong seed list còn tồn tại/hoạt động (đã cảnh báo rõ trong code comment + README là "best effort").
- Cả `single-file/` và `landing/` giờ đã đồng bộ hoàn toàn (schema, provider, fallback chain, prompt) — không còn bản legacy OpenAI-only nào khác biệt.

## 4. Bước tiếp theo

1. Test thật với API key: chạy "Dùng dữ liệu mẫu" → "Chuẩn hóa" → "Viết cho tất cả store" trên cả `single-file` và `landing` để xác nhận gọi API thành công + fallback chain hoạt động đúng khi cố tình dùng key sai ở provider chính.
2. Nếu content AI trả về bị lỗi JSON parse (rủi ro nhẹ do `about_store` dài hơn, 4 đoạn) — cân nhắc thêm xử lý escape/repair JSON nếu gặp thực tế.
3. Nếu muốn deploy tool cho nhiều người dùng chung (đã thảo luận, chưa làm): deploy static lên Vercel/Netlify — không cần build command, mỗi người tự nhập API key riêng (lưu trong `localStorage` trình duyệt của họ, không dùng chung).
