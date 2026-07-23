# Tool Auto Fill — Multi-provider AI + Fallback Chain

## 1. Mục tiêu

Nâng cấp tool nội bộ `Tool Auto Fill/` (chuẩn hóa store/coupon từ sheet thô sang Excel sạch) để hỗ trợ nhiều AI provider, tự động rotate khi bị rate limit, và cải thiện chất lượng prompt sinh nội dung SEO cho từng store.

## 2. Những phần đã hoàn thành

### Cấu trúc file
- `Tool Auto Fill/store-coupon-normalizer.html` — bản gốc, OpenAI-only, model hardcode `gpt-4o-mini`, **không có** UI chọn provider/model (ngoài phạm vi các nâng cấp multi-provider bên dưới).
- `Tool Auto Fill/single-file/store-coupon-normalizer.html` — bản redesign theo brand NovalyticDeals (màu `--brand-*`/`--accent-*` lấy từ `app/globals.css`, font Inter/Poppins), gộp 1 file.
- `Tool Auto Fill/landing/` (`index.html` + `css/styles.css` + `js/app.js`) — bản landing nhiều section (hero, step-by-step, tool), logic JS giống hệt bản single-file.

### Schema Excel xuất ra (`normalize()`)
- **Stores**: `name, link_website, link_affiliate, description, about_store` (bỏ `featured`/`seo_title`/`seo_description` cũ; `link_website` = `link_affiliate` = giá trị cột "Link Affiliate" nguồn).
- **Coupons**: `store_name, title, type(CODE|DEAL|FREESHIP), code, discount_type(PERCENT|AMOUNT|OTHER), discount_value, currency($/€/£, chỉ khi AMOUNT), link_affiliate(kế thừa từ store), exclusive(TRUE chỉ ở coupon đầu tiên của mỗi store)`.
- Parser hỗ trợ currency `$`, `€`, `£` cả 2 chiều (`10€` / `€10`).

### Multi-provider AI (single-file + landing)
- `PROVIDERS` object: `openai`, `anthropic`, `gemini`, `openrouter` — mỗi provider có `label`, `defaultModel`, `keyName` (localStorage riêng), `keyLabel`, `modelsUrl`, `note`, `async call(key, model, prompt)`.
- UI: dropdown chọn provider, input Model (auto-fill default, editable), input API key (password, lưu riêng theo provider), link "Xem danh sách model" (đổi theo provider).
- Default model Gemini hiện là `gemini-3.5-flash` (đã đổi từ `gemini-2.0-flash` theo yêu cầu).

### Fallback chain (tự động đổi provider/model khi lỗi)
- Checkbox `#autoSwitch` (mặc định BẬT) + textarea `#fallbackChain` (mỗi dòng `provider:model`, seed mặc định gồm 3 model Gemini + 3 model free OpenRouter), cả 2 đều persist qua `localStorage` (`novaltic_autoswitch`, `novaltic_fallback_chain`).
- `buildAttemptChain()`: vị trí #0 luôn là lựa chọn tay hiện tại; các dòng fallback chỉ được thêm nếu provider đó **đã có key lưu sẵn**; parse tách ở dấu `:` đầu tiên (an toàn với model id kiểu `google/gemini-2.0-flash-exp:free`); bỏ qua dòng trùng.
- Vòng lặp `genAI.onclick`: mỗi store thử `chain[chainPos]`; lỗi (bất kỳ loại lỗi nào, không phân loại 429 vs khác) → `chainPos++`, thử lại **cùng store** với attempt kế tiếp; `chainPos` không reset giữa các store, không wraparound; hết chain mới dừng batch. Tắt checkbox → hành vi y hệt cũ (1 attempt, lỗi là dừng).
- Ghi chú hiệu quả (trong code comment + UI hint): Gemini free tier tính quota riêng theo từng model (rotate hiệu quả); OpenRouter free tính theo tài khoản/key (rotate model trong OpenRouter chưa chắc né được limit, chỉ hữu ích như danh tính fallback riêng).

### UX nhỏ khác
- Upload file: tên file hiển thị ngay trong khung dashed (`#dropTitle`/`#dropHint`) kèm trạng thái `.filled` (viền liền + nền brand), không còn dòng riêng bên dưới.
- Độ rộng cột bảng preview: Store `name/description/about_store` và Coupon `store_name/title` đã set `min-width` qua CSS `nth-child`.

### Prompt SEO (`buildPrompt(storeName, titles, websiteUrl)`)
- Dịch/thích nghi từ file `prompt-seo.txt` người dùng cung cấp (2 lần lặp): style copywriter SEO tiếng Anh, nguyên tắc E-E-A-T, tránh từ marketing thổi phồng, không bịa thông tin ngoài dữ liệu có (store name/website/coupon titles).
- `description`: 1-2 câu, 20-40 từ.
- `about_store`: **đúng 4 đoạn**, 150-300 từ, theo cấu trúc Paragraph 1-4 (giới thiệu → sản phẩm/tính năng → trải nghiệm mua sắm → tóm tắt trung lập), nối bằng `\n\n`.
- Nhúng nguyên văn ví dụ "SwissChems" (few-shot) người dùng cung cấp, có dặn rõ AI chỉ tham khảo tông giọng/cấu trúc, không copy nội dung.
- Output vẫn giữ JSON `{"description":"...","about_store":"..."}` để khớp `extractJSON()` hiện có (khác với format text thuần trong file gốc).

## 3. Trạng thái hiện tại

- Cả `single-file/store-coupon-normalizer.html` và `landing/js/app.js` đã pass `node --check` (cú pháp JS hợp lệ) sau mọi lần sửa.
- Đã test độc lập bằng Node (ngoài browser): `normalize()` với dữ liệu mẫu (gồm case `$`/`€`) ra đúng schema; `buildAttemptChain()`/`parseFallbackLine()` test 4 case (có key, không key, trùng primary, tắt autoSwitch) đều đúng; `buildPrompt()` render không lỗi template literal.
- **Chưa test end-to-end với API key thật** (sandbox không có key) — chưa xác nhận được: (a) các API có chấp nhận request từ `Origin: null` khi mở qua `file://` hay không, (b) model id `gemini-3.5-flash` và các model free OpenRouter trong seed list có thực sự tồn tại/hoạt động tại thời điểm dùng hay không (đã cảnh báo rõ trong code comment + UI hint là "best effort", cần tự kiểm tra qua link "Xem danh sách model").
- File gốc `Tool Auto Fill/store-coupon-normalizer.html` chỉ được cập nhật phần schema Store/Coupon (mục Schema Excel ở trên), **không có** fallback chain / multi-provider — giữ nguyên kiến trúc OpenAI-only ban đầu.

## 4. Bước tiếp theo

1. Test thật với API key: chạy "Dùng dữ liệu mẫu" → "Chuẩn hóa" → "Viết cho tất cả store" trên cả `single-file` và `landing` để xác nhận:
   - Gọi API thành công qua `file://` (nếu lỗi CORS/Origin null, serve qua `python3 -m http.server` thay vì double-click).
   - Model `gemini-3.5-flash` và các model free OpenRouter trong `DEFAULT_FALLBACK_CHAIN` còn hợp lệ.
   - Fallback chain hoạt động đúng khi cố tình dùng key sai ở provider chính (xem mục Verify trong plan cũ `.claude/plans/...wobbly-sloth.md` nếu cần các bước chi tiết).
2. Nếu content AI trả về bị lỗi JSON parse (rủi ro tăng nhẹ do `about_store` giờ dài hơn, 4 đoạn có thể chứa ký tự đặc biệt) — cân nhắc thêm xử lý escape/repair JSON nếu gặp thực tế, hiện chưa cần vì chưa có bằng chứng lỗi.
3. Nếu muốn đồng bộ tính năng multi-provider/fallback sang file gốc `Tool Auto Fill/store-coupon-normalizer.html` — hiện đang chủ động để ngoài phạm vi, cần yêu cầu rõ nếu muốn làm.
