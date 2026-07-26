# Tool Auto Fill — Multi-provider AI + Fallback Chain + Đóng gói + Tích hợp Dashboard

## 1. Mục tiêu

Nâng cấp tool nội bộ `Tool Auto Fill/` (chuẩn hóa store/coupon từ sheet thô sang Excel sạch) để hỗ trợ nhiều AI provider, tự động rotate khi bị rate limit, cải thiện chất lượng prompt sinh nội dung SEO cho từng store, đóng gói thành package độc lập, và thêm lối vào tool ngay từ Dashboard admin.

## 2. Những phần đã hoàn thành

### Cấu trúc file hiện tại
- `Tool Auto Fill/single-file/store-coupon-normalizer.html` — bản redesign theo brand NovalyticDeals (màu `--brand-*`/`--accent-*` lấy từ `app/globals.css`, font Inter/Poppins), gộp 1 file.
- `Tool Auto Fill/landing/` (`index.html` + `css/styles.css` + `js/app.js`) — bản landing nhiều section (hero, step-by-step, tool), logic JS giống hệt bản single-file. Đây là **bản gốc để sửa** khi cần thay đổi tool.
- `Tool Auto Fill/README.md` — tài liệu đầy đủ: tool làm gì, cách dùng 2 biến thể, schema Excel output chi tiết, tính năng AI/fallback chain.
- Bản gốc `Tool Auto Fill/store-coupon-normalizer.html` (OpenAI-only, model hardcode) đã bị xoá khỏi folder từ trước — hiện chỉ còn `single-file/` và `landing/`, cả 2 đều multi-provider.

### Schema Excel xuất ra (`normalize()`)
- **Stores**: `name, link_website, link_affiliate, description, about_store` (`link_website` = `link_affiliate` = giá trị cột "Link Affiliate" nguồn).
- **Coupons**: `store_name, title, type(CODE|DEAL|FREESHIP), code, discount_type(PERCENT|AMOUNT|OTHER), discount_value, currency($/€/£, chỉ khi AMOUNT), link_affiliate(kế thừa từ store), exclusive(TRUE chỉ ở coupon đầu tiên của mỗi store)`.
- Parser hỗ trợ currency `$`, `€`, `£` cả 2 chiều (`10€` / `€10`).
- **Quan trọng**: schema này khớp chính xác với những gì tính năng admin "Auto Fill Store" của NovalticDeals (`lib/parseAutoFillWorkbook.ts`) mong đợi để import trực tiếp — đây là "hợp đồng" duy nhất giữa tool và app chính.

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

### Fix bug upload "chọn file rồi vẫn báo Chưa chọn file"
- Nguyên nhân: `$('file').onchange` là hàm `async`, đọc file (`arrayBuffer`+`XLSX.read`+`sheet_to_json`) không có `try/catch` — lỗi đọc file bị nuốt âm thầm, `pendingRows` không được set nhưng checkmark UI (set đồng bộ trước khi đọc) vẫn hiện "đã chọn file thành công".
- Đã fix cả 3 bản (`single-file/`, `landing/js/app.js`, **và** `public/tools/auto-fill/js/app.js` — bản publish ban đầu bị bỏ sót khi fix lần đầu, gây bug vẫn còn trên Dashboard dù đã sửa 2 bản nguồn): bọc `try/catch`, reset `pendingRows=null` + xoá `$('error')` đầu handler, khi lỗi thì revert checkmark (`⚠ <tên file>` + bỏ class `.filled`) và hiện thông báo cụ thể (`Không đọc được file "...": <lỗi thật>`).
- Thêm hardening: disable nút `#run` (Chuẩn hóa) trong lúc đang đọc file (`$('run').disabled=true` đầu try, `=false` trong `finally`) — chặn nốt trường hợp bấm Chuẩn hóa đúng lúc file chưa đọc xong.
- Đã verify bằng Playwright (serve `public/tools/auto-fill/` qua `python3 -m http.server`, dùng đúng file thật user cung cấp): file zip hỏng → hiện lỗi rõ ràng ngay lúc chọn; file input hợp lệ (đúng schema `Store/Link Affiliate/Coupon Code/Discount value/Title`) → chạy hết pipeline, ra kết quả, không lỗi.

### Fix bug "XLSX is not defined" trên bản Dashboard + xoá single-file/
- Nguyên nhân: `next.config.ts` áp `Content-Security-Policy` cho **mọi** route (`headers(): [{ source: "/:path*", ... }]`, kể cả file tĩnh trong `public/`). `script-src` không cho phép `cdnjs.cloudflare.com` — nơi cả 2 bản tool load thư viện `xlsx` qua `<script src="https://cdnjs.cloudflare.com/...">`. Mở tool qua Next.js (`/tools/auto-fill/index.html`) bị CSP chặn script này → `XLSX` không được định nghĩa → mọi thao tác liên quan xlsx lỗi "XLSX is not defined". Mở qua `file://`/`python3 -m http.server` (không qua Next.js) thì không có CSP nên vẫn chạy bình thường — đây là lý do "landing" test riêng thì được mà bản Dashboard thì không.
- Fix: **vendor thư viện xlsx cục bộ** thay vì load CDN — copy `node_modules/xlsx/dist/xlsx.full.min.js` (bản 0.20.3, đã patch 2 CVE Prototype Pollution/ReDoS của bản CDN 0.18.5 cũ, cùng bản đã dùng cho `lib/parseAutoFillWorkbook.ts`) vào `landing/js/` và `public/tools/auto-fill/js/`, đổi `<script src>` sang path tương đối `js/xlsx.full.min.js`. Cách này né được CSP hoàn toàn (`'self'` vốn đã cho phép) thay vì phải nới CSP (nới CSP sẽ ảnh hưởng toàn site, không chỉ tool này).
- **Đã xoá `Tool Auto Fill/single-file/`** theo yêu cầu — chỉ giữ `landing/` làm bản nguồn duy nhất (đỡ phải đồng bộ 2 nơi mỗi lần sửa). `README.md` đã cập nhật theo.
### Fix Google Fonts bị CSP chặn
- Đã vendor local Inter (400/500/600/700) + Poppins (600/700/800) — chỉ lấy 2 subset `latin`+`vietnamese` (bỏ cyrillic/greek/devanagari không liên quan), tổng 5 file `.woff2` duy nhất (~82KB) tải từ chính Google Fonts API (`fonts.gstatic.com`) về `landing/fonts/` + `public/tools/auto-fill/fonts/`. `@font-face` khai báo thẳng trong `css/styles.css`, bỏ hẳn 3 dòng `<link>` Google Fonts CDN trong `index.html` (preconnect + stylesheet).
- Lý do dùng 5 file cho 7 khai báo weight: Google Fonts trả về cùng 1 file biến-thể (variable font) cho các weight 400/500/600/700 của Inter (khác `font-weight` trong CSS, cùng file vật lý) — browser tự nội suy đúng weight từ file variable, không phải lỗi.
- Đã verify bằng Playwright qua Next.js dev server thật: `document.fonts.check('Inter')`/`check('Poppins')` đều `true` (font thật đã load, không phải fallback), **0 CSP violation** trong console (trước đó có đúng 1 dòng "violates... style-src... blocked").

### Hiển thị kết quả AI theo thời gian thực + nút "Dừng hẳn"
- Vấn đề trước: `render()` chỉ vẽ lại bảng Stores đúng 1 lần — khi cả batch xong hoặc khi lỗi làm dừng cả batch; trong lúc chạy chỉ có dòng chữ tiến độ, không thấy bảng cập nhật; không có cách nào dừng giữa chừng (không cờ huỷ, không `AbortController`, không nút Stop nào tồn tại).
- Fix (`landing/js/app.js` + đồng bộ `public/tools/auto-fill/js/app.js`):
  - `render(out, scroll=true)` — thêm tham số `scroll` để tránh trang bị giật cuộn liên tục nếu gọi `render()` nhiều lần trong 1 batch; các lời gọi cũ giữ nguyên (mặc định `true`), chỉ lời gọi mới truyền `false`.
  - Gọi `render(OUT, false)` ngay sau khi 1 store được AI viết xong (`s.description`/`s.about_store` vừa gán) — bảng cập nhật ngay tức thì cho store đó, không đợi hết batch.
  - Cờ `stopRequested` (module-level) + hàm dùng chung `finishRun(reason, completed, extra)` gom cleanup của cả 3 điểm thoát khỏi vòng lặp `genAI` (`'success'`/`'manual'`/`'exhausted'`) — tránh lặp lại 4-5 dòng cleanup (message, disable/enable nút, ẩn/hiện `#stopAI`, reset cờ, `render(OUT)`) ở nhiều nơi.
  - 2 checkpoint kiểm tra `stopRequested` (đầu vòng ngoài theo store, đầu vòng trong theo attempt fallback) — theo đúng quyết định của user: **không dùng `AbortController`**, nếu đang có request AI chạy dở thì cứ để nó xong (thành công hay lỗi) rồi mới dừng ở checkpoint kế tiếp, không sửa 4 hàm `call()` của các provider.
  - Nút mới `#stopAI` ("Dừng hẳn", class `btn-ghost hidden`, `disabled` mặc định) — hiện + enable khi batch bắt đầu, ẩn + disable lại khi `finishRun()` chạy (bất kể lý do nào). Không cần CSS mới, tái dùng `.btn-ghost`/`.btn:disabled`/`.hidden`/`.row` có sẵn.
  - 3 message cuối phân biệt rõ: thành công (giữ nguyên câu cũ), dừng thủ công (`Đã dừng theo yêu cầu — hoàn thành X/Y store.`), tự động dừng do cạn hết fallback chain (`Tự động dừng ở store "..." — ... Hoàn thành X/Y store.` — tiền tố "Tự động dừng" khác hẳn "Đã dừng theo yêu cầu" để user phân biệt được dừng do hết quota/lỗi hay do họ tự bấm Stop).
  - Nhánh dead-code có sẵn từ trước (`chainPos>=chain.length`, không bao giờ chạy tới vì `chainPos` luôn được giữ `<chain.length`) — **giữ nguyên điều kiện/vị trí, không xoá**, chỉ đổi phần cleanup sang gọi `finishRun()` cho nhất quán với 2 nhánh dừng còn lại, kèm comment giải thích rõ tại sao nó không bao giờ chạy tới.
- Đã verify bằng Playwright, 3 kịch bản (mock response provider qua `page.route()`, không dùng key thật):
  1. **Incremental render**: trong lúc store thứ 2 đang chờ phản hồi, bảng đã hiện sẵn nội dung của store thứ 1 (không đợi hết 4/4 store).
  2. **Dừng thủ công giữa chừng**: bấm "Dừng hẳn" khi store thứ 2 đang in-flight → request đó vẫn hoàn thành bình thường (đúng thiết kế đã chốt với user) → store thứ 3 không bị gọi → message "Đã dừng theo yêu cầu — hoàn thành 2/4 store." → nút `genAI` bật lại, `#stopAI` ẩn + disable lại.
  3. **Tự động dừng khi hết fallback chain**: mock 2 lần đầu thành công, từ lần 3 trả lỗi 429 → message "Tự động dừng ở store "Home Luxury Scents"... Hoàn thành 2/4 store." (rõ ràng khác câu dừng thủ công), 2 store đầu vẫn còn nguyên nội dung trên bảng, 2 store sau để trống.
  - Lưu ý cách test (lần đầu): ban đầu phải serve qua `python3 -m http.server` (không phải Next.js dev server) vì phát hiện bug CSP connect-src (xem mục ngay bên dưới) chặn hết mock request; sau khi fix CSP đã re-run lại đúng bộ 3 kịch bản trên qua Next.js dev server thật (`localhost:3000/tools/auto-fill/index.html`, CSP thật bật) — kết quả giống hệt, xác nhận CSP không còn chặn request tới các host AI provider nữa.

### Fix CSP `connect-src` chặn gọi AI provider thật
- Phát hiện trong lúc verify mục tính năng ngay trên qua Next.js dev server thật: mock `page.route()` không bao giờ được gọi tới, console báo `Refused to connect... violates connect-src`.
- Nguyên nhân: `next.config.ts` (dòng `connect-src`) trước đó chỉ có `'self' https://www.google-analytics.com https://plausible.io https://vitals.vercel-insights.com` — **không có** `api.openai.com`, `api.anthropic.com`, `generativelanguage.googleapis.com`, `openrouter.ai`. CSP áp dụng cho mọi route (`headers(): [{source:"/:path*"}]`) không phân biệt dev/production, nên bug này tồn tại y hệt trên Vercel thật, không chỉ local.
- Hệ quả (trước khi fix): bấm "Viết cho tất cả store" trên bản Dashboard thật **luôn lỗi "Failed to fetch" ngay từ store đầu tiên**, bất kể key/model đúng hay sai — vì trình duyệt tự chặn request trước khi nó rời khỏi renderer, không tới cả network layer.
- Khác các bug CSP trước (XLSX CDN, Google Fonts) — không thể "vendor cục bộ" một API AI thật (không phải static asset). Đã xin xác nhận user trước (đây là sửa file cấu hình bảo mật dùng chung toàn site, `.claude/rules/backend-architecture.md` mục "Auth & bảo mật") — user chọn sửa luôn.
- **Đã fix**: thêm 4 host trên vào `connect-src` trong `next.config.ts`, kèm comment giải thích lý do (dùng cho Tool Auto Fill gọi trực tiếp từ browser bằng key người dùng tự nhập). `tsc --noEmit` pass. Đã restart dev server (đổi `next.config.ts` cần restart, không hot-reload), xác nhận qua `curl -D -` header CSP mới có đủ 4 host, và re-run lại Playwright test (mock response, không dùng key thật) qua đúng dev server thật — cả 3 kịch bản (incremental render / dừng thủ công / tự động dừng khi hết fallback) đều pass, không còn bị CSP chặn.

### Fix bug `XLSX.read()` treo vô thời hạn với file zip cắt cụt
- Phát hiện trong lúc test: 1 file .xlsx bị cắt cụt (còn magic bytes zip hợp lệ nhưng thiếu central directory) khiến `XLSX.read()` treo vô thời hạn (không throw, không timeout tự nhiên) — khác với file rác/random bytes (được SheetJS xử lý khoan dung, không hang). Vì JS 1 luồng, `setTimeout` đơn thuần không cứu được vì main thread chính là thứ bị chặn đứng.
- Fix: chuyển việc đọc file (`XLSX.read`+`sheet_to_json`) sang chạy trong Web Worker riêng (`js/xlsx-worker.js`, `importScripts('xlsx.full.min.js')`) + timeout 15s (`FILE_READ_TIMEOUT_MS`) ở main thread — quá giờ thì `worker.terminate()` và báo lỗi rõ ràng, không cần main thread phải "ngắt" được gì cả vì worker là thread riêng, terminate được dù đang treo.
- Đã verify bằng Playwright qua Next.js dev server thật: file thật `store1.xlsx` vẫn nhanh (~0.8s, không đổi hành vi); đúng file từng gây treo trước đây giờ main thread vẫn phản hồi được (test `page.evaluate` giữa chừng), sau đúng ~15s tự huỷ worker + hiện lỗi "Đọc file quá lâu... đã huỷ" thay vì đứng hình tab.

### Tích hợp vào Dashboard admin
- Copy `Tool Auto Fill/landing/{index.html,css/styles.css,js/app.js}` → `public/tools/auto-fill/{index.html,css/styles.css,js/app.js}` nguyên vẹn (path tương đối trong file vẫn đúng, không sửa gì) — để Next.js serve như static asset tại `/tools/auto-fill/index.html`.
- Thêm nút **"Auto Fill Tool"** trong `app/admin/page.tsx`, đặt cạnh nút "Auto Fill Store" hiện có (bọc chung 1 `<div className="flex items-center gap-2">` để không phá layout `justify-between` của toolbar title/actions). Nút là thẻ `<a target="_blank" rel="noopener noreferrer" href="/tools/auto-fill/index.html">`, style outline (`border-brand-600 text-brand-700`) để phân biệt với nút chính "Auto Fill Store" (fill `bg-brand-600`).
- `Tool Auto Fill/landing/` vẫn là bản gốc để sửa; `public/tools/auto-fill/` là bản đã "publish" — sửa tool sau này cần copy lại thủ công sang `public/tools/auto-fill/` để đồng bộ bản đang live (không có build step tự sync).
- Lưu ý bảo mật đã ghi nhận: `public/` không đi qua NextAuth (khác `/admin/*`), ai có URL cũng mở được tool — chấp nhận được vì bản thân tool không có secret/không truy cập DB, chỉ xử lý Excel phía client + gọi AI bằng key người dùng tự nhập.
- Trong lúc test, phát hiện thêm 1 bug hydration mismatch (không phải do tool gây ra) ở `components/admin/PopularStoresControls.tsx:109` — `.toLocaleString()` thiếu locale khiến server/client render khác định dạng ngày. Đã fix bằng cách thêm `"vi-VN"` (khớp convention `formatDate()` có sẵn trong `app/admin/page.tsx`). Đã kiểm tra thêm 2 lỗi liên quan trong log (hook-order ở `StoreTable.tsx`, Prisma pool timeout) nhưng không tìm thấy bug thật trong code hiện tại — nhiều khả năng là hệ quả dây chuyền/tạm thời, không sửa gì thêm.
- Đã commit + push lên `origin/main` (commit `5f45256`, message "Add Auto Fill Tool shortcut on admin Dashboard, fix date hydration mismatch").

## 3. Trạng thái hiện tại

- `single-file/store-coupon-normalizer.html` và `landing/js/app.js` pass `node --check` sau mọi lần sửa; `tsc --noEmit` pass sau khi sửa `app/admin/page.tsx` và `PopularStoresControls.tsx`.
- Đã test độc lập bằng Node: `normalize()` (gồm case `$`/`€`) đúng schema; `buildAttemptChain()`/`parseFallbackLine()` đúng 4 case; `buildPrompt()` render không lỗi template literal.
- 3 file tại `public/tools/auto-fill/` đã xác nhận HTTP 200 qua dev server (`index.html`, `css/styles.css`, `js/app.js`).
- **Chưa test end-to-end với API key thật** — chưa xác nhận: (a) API có chấp nhận `Origin: null` khi mở qua `file://`, (b) model `gemini-3.5-flash` và các model free OpenRouter trong seed list còn tồn tại/hoạt động.
- **Chưa tự xem trực quan nút "Auto Fill Tool" trên `/admin`** — route này được NextAuth bảo vệ, không có tài khoản đăng nhập để tự kiểm tra bằng trình duyệt.
- Cả `single-file/` và `landing/` đã đồng bộ hoàn toàn (schema, provider, fallback chain, prompt) — không còn bản legacy OpenAI-only nào khác biệt.
- **`landing/` và `public/tools/auto-fill/`** (2 bản còn lại sau khi xoá `single-file/`) hiện đồng bộ 100% — đã `diff -rq` xác nhận không còn khác biệt nào, gồm cả tính năng incremental render + Dừng hẳn vừa thêm.
- Tính năng incremental render + nút "Dừng hẳn" đã verify đầy đủ 3 kịch bản qua Playwright (`node --check` pass cả 2 file `app.js`) — xem chi tiết ở mục 2.
- **CSP `connect-src` đã fix** — `api.openai.com`/`api.anthropic.com`/`generativelanguage.googleapis.com`/`openrouter.ai` đã thêm vào allowlist của `next.config.ts` (trước đó bị chặn hoàn toàn, xem mục "Fix CSP connect-src..." ở phần 2). Đã xác nhận qua `curl -D -` header CSP mới đúng, và re-verify lại 3 kịch bản incremental/Dừng hẳn/tự động dừng bằng mock response qua chính dev server thật (không còn bug CSP chặn).

## 4. Bước tiếp theo

1. Đăng nhập admin thật, mở `/admin`, xác nhận nút "Auto Fill Tool" hiển thị đúng cạnh "Auto Fill Store" và bấm vào mở đúng tab mới tới `/tools/auto-fill/index.html`.
2. ~~Quyết định có fix CSP `connect-src` không~~ — đã fix, xem mục 2/3.
3. Test thật với API key trên `landing/` (hoặc `public/tools/auto-fill/`) để xác nhận gọi API thành công + fallback chain hoạt động đúng khi cố tình dùng key sai ở provider chính — hiện mới verify bằng mock response, chưa test với key/model thật.
4. Nếu content AI trả về bị lỗi JSON parse (rủi ro nhẹ do `about_store` dài hơn, 4 đoạn) — cân nhắc thêm xử lý escape/repair JSON nếu gặp thực tế.
5. Nhớ: mỗi khi sửa `Tool Auto Fill/landing/`, phải copy lại thủ công sang `public/tools/auto-fill/` để bản live trên Dashboard được cập nhật theo.
